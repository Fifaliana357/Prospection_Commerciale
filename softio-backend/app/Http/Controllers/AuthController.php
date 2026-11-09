<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Commercial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\ValidationException;
use Throwable;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $email = trim($validated['email']);
        $password = $validated['password'];
        $admin = Admin::where('email', $email)->first();
        $commercial = Commercial::where('email', $email)->first();
        $adminMatches = $admin && Hash::check($password, $admin->password);
        $commercialMatches = $commercial && Hash::check($password, $commercial->password);

        if ($adminMatches && $commercialMatches) {
            throw ValidationException::withMessages([
                'email' => ['Email ou mot de passe incorrect.'],
            ]);
        }

        if (! $adminMatches && ! $commercialMatches) {
            throw ValidationException::withMessages([
                'email' => ['Email ou mot de passe incorrect.'],
            ]);
        }

        $user = $adminMatches ? $admin : $commercial;
        $type = $adminMatches ? 'admin' : 'commercial';

        if ($type === 'admin' && $user->email_verification_required && ! $user->est_verifie) {
            return response()->json([
                'code' => 'email_not_verified',
                'message' => 'Vérifiez votre adresse e-mail avant de vous connecter.',
            ], 403);
        }

        if ($type === 'commercial' && ! $user->actif) {
            return response()->json([
                'message' => 'Votre compte est désactivé.',
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Connexion réussie',
            'user' => $user,
            'type' => $type,
            'token' => $token,
        ]);
    }

    public function register(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:191',
            'prenom' => 'required|string|max:191',
            'entreprise' => 'required|string|max:191',
            'telephone' => 'required|string|max:50',
            'email' => [
                'required',
                'email',
                'max:191',
                function (string $attribute, mixed $value, \Closure $fail) {
                    if (Admin::where('email', $value)->exists() || Commercial::where('email', $value)->exists()) {
                        $fail('Cette adresse e-mail est déjà utilisée.');
                    }
                },
            ],
            'password' => 'required|string|min:8|confirmed',
        ]);

        $admin = Admin::create([
            'nom' => $validated['nom'],
            'prenom' => $validated['prenom'],
            'entreprise' => $validated['entreprise'],
            'telephone' => $validated['telephone'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'est_verifie' => false,
            'email_verification_required' => true,
        ]);

        try {
            $this->sendVerificationEmail($admin);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'Le compte a été créé, mais l’e-mail de vérification n’a pas pu être envoyé. Réessayez depuis la page de connexion.',
                'email' => $admin->email,
            ], 503);
        }

        return response()->json([
            'message' => 'Compte créé. Consultez votre boîte e-mail pour vérifier votre adresse avant de vous connecter.',
        ], 201);
    }

    public function verifyEmail(string $type, int $id, string $hash)
    {
        $model = $type === 'admin' ? Admin::class : ($type === 'commercial' ? Commercial::class : null);
        abort_if($model === null, 404);

        $user = $model::findOrFail($id);
        abort_unless(hash_equals(sha1($user->email), $hash), 403);

        if ($type === 'admin') {
            $user->forceFill([
                'est_verifie' => true,
                'email_verification_required' => false,
            ])->save();
        }

        return redirect(rtrim(config('app.frontend_url'), '/').'/login?status=email-verified');
    }

    public function resendVerification(Request $request)
    {
        $validated = $request->validate(['email' => 'required|email']);
        $admin = Admin::where('email', $validated['email'])
            ->where('email_verification_required', true)
            ->where('est_verifie', false)
            ->first();

        if ($admin) {
            try {
                $this->sendVerificationEmail($admin);
            } catch (Throwable $exception) {
                report($exception);

                return response()->json([
                    'message' => 'Le service e-mail est momentanément indisponible. Réessayez dans quelques instants.',
                ], 503);
            }
        }

        return response()->json([
            'message' => 'Si un compte en attente de vérification correspond à cette adresse, un nouveau lien vient d’être envoyé.',
        ]);
    }

    public function forgotPassword(Request $request)
    {
        $validated = $request->validate(['email' => 'required|email']);
        $admin = Admin::where('email', $validated['email'])->first();
        $commercial = $admin ? null : Commercial::where('email', $validated['email'])->first();

        if ($admin || $commercial) {
            $broker = $admin ? 'admins' : 'commerciaux';
            try {
                Password::broker($broker)->sendResetLink(['email' => $validated['email']]);
            } catch (Throwable $exception) {
                report($exception);

                return response()->json([
                    'message' => 'Le service e-mail est momentanément indisponible. Réessayez dans quelques instants.',
                ], 503);
            }
        }

        return response()->json([
            'message' => 'Votre demande a bien été prise en compte. Si un compte est associé à cette adresse, vous recevrez un e-mail contenant un lien de réinitialisation. Pensez à vérifier vos courriers indésirables.',
        ]);
    }

    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $admin = Admin::where('email', $validated['email'])->first();
        $broker = $admin ? 'admins' : 'commerciaux';
        $status = Password::broker($broker)->reset($validated, function ($user, string $password) {
            $user->forceFill([
                'password' => Hash::make($password),
            ])->save();
            $user->tokens()->delete();
        });

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return response()->json(['message' => 'Votre mot de passe a été réinitialisé. Vous pouvez vous connecter.']);
    }

    private function sendVerificationEmail(Admin $admin): void
    {
        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addHours(24),
            ['type' => 'admin', 'id' => $admin->id_admin, 'hash' => sha1($admin->email)],
        );

        Mail::raw(
            "Bonjour {$admin->prenom} {$admin->nom},\n\nConfirmez votre adresse e-mail en cliquant sur ce lien (valable 24 heures) :\n{$verificationUrl}\n\nSi vous n’avez pas créé ce compte, ignorez cet e-mail.",
            function ($message) use ($admin) {
                $message->to($admin->email)
                    ->subject('Vérifiez votre adresse e-mail - '.config('app.name'));
            },
        );
    }

    /**
     * Déconnexion
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Déconnexion réussie',
        ]);
    }

    /**
     * Récupérer l'utilisateur connecté
     */
    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user(),
            'type' => $request->user() instanceof Admin ? 'admin' : 'commercial',
        ]);
    }
}
