<?php

namespace Database\Seeders;

use App\Models\BibliothequeFichier;
use App\Models\Closing;
use App\Models\Commercial;
use App\Models\Facture;
use App\Models\Interet;
use App\Models\MouvementStock;
use App\Models\Produit;
use App\Models\Prospect;
use App\Models\Prospection;
use App\Models\RendezVous;
use App\Models\SavTicket;
use App\Models\User;
use App\Models\Vente;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Utilisateur Admin
        User::firstOrCreate(
            ['email' => 'admin@softio.mg'],
            [
                'name' => 'Admin Softio',
                'password' => Hash::make('password123'),
            ]
        );

        // 2. Prospects
        $prospects = [
            ['matricule' => 'P-0042', 'nom' => 'Rakoto', 'prenom' => 'Jean', 'type' => 'particulier', 'email' => 'jean.rakoto@email.com', 'contact' => '034 12 345 67', 'entreprise' => '-', 'classification' => 'Chaud', 'pays' => 'Madagascar', 'domaine' => 'IT'],
            ['matricule' => 'P-0043', 'nom' => '', 'prenom' => '', 'type' => 'entreprise', 'email' => 'contact@nirinfo.mg', 'contact' => '034 70 840 46', 'entreprise' => "Nir'Info", 'classification' => 'Nouveau', 'pays' => 'Madagascar', 'domaine' => 'Informatique'],
            ['matricule' => 'P-0044', 'nom' => 'Rasoanaivo', 'prenom' => 'Mamy', 'type' => 'particulier', 'email' => 'mamy.raso@email.com', 'contact' => '033 98 765 43', 'entreprise' => '-', 'classification' => 'En cours', 'pays' => 'Madagascar', 'domaine' => 'Commerce'],
            ['matricule' => 'P-0045', 'nom' => 'Andrianasolo', 'prenom' => 'Faly', 'type' => 'particulier', 'email' => 'faly.andri@email.com', 'contact' => '032 11 223 34', 'entreprise' => 'SoftLabs', 'classification' => 'Chaud', 'pays' => 'Madagascar', 'domaine' => 'IT'],
            ['matricule' => 'P-0046', 'nom' => '', 'prenom' => '', 'type' => 'entreprise', 'email' => 'info@softlabs.mg', 'contact' => '034 56 789 01', 'entreprise' => 'SoftLabs', 'classification' => 'Perdu', 'pays' => 'Madagascar', 'domaine' => 'Services'],
        ];
        foreach ($prospects as $p) {
            Prospect::updateOrCreate(['matricule' => $p['matricule']], $p);
        }

        // 3. Prospections
        $prospections = [
            ['date' => '16/10/2026', 'objet' => 'Salut', 'contact' => '034 36 040 22', 'nom' => 'Szs Ketaka', 'entreprise' => '-', 'fonction' => '-', 'etat' => 'Non clôturé', 'editeur' => 'Admin', 'score' => 49],
            ['date' => '16/10/2026', 'objet' => 'Présentation Softio', 'contact' => '034 70 840 46', 'nom' => 'Jean Rakoto', 'entreprise' => "Nir'Info", 'fonction' => 'Directeur', 'etat' => 'Non clôturé', 'editeur' => 'Admin', 'score' => 69],
            ['date' => '23/09/2026', 'objet' => 'Commande speaker', 'contact' => '032 11 112 02', 'nom' => 'Client', 'entreprise' => '-', 'fonction' => '-', 'etat' => 'Clôturé', 'editeur' => 'Admin', 'score' => null],
            ['date' => '23/09/2026', 'objet' => 'Commande power station 1000wh', 'contact' => '034 20 701 15', 'nom' => 'Client', 'entreprise' => '-', 'fonction' => '-', 'etat' => 'Clôturé', 'editeur' => 'Admin', 'score' => null],
        ];
        foreach ($prospections as $pr) {
            Prospection::firstOrCreate(['objet' => $pr['objet'], 'date' => $pr['date']], $pr);
        }

        // 4. Rendez-vous
        $rdvs = [
            ['date' => '21/10/2026', 'heure' => '09:30', 'prospect' => 'Jean Rakoto', 'contact' => '034 12 345 67', 'mode' => 'Visio', 'lieu' => 'Google Meet', 'commentaire' => "Présentation de l'offre Power Station", 'statut' => 'Confirmé'],
            ['date' => '21/10/2026', 'heure' => '14:00', 'prospect' => "Nir'Info", 'contact' => '034 70 840 46', 'mode' => 'Présentiel', 'lieu' => "Siège Nir'Info - Antananarivo", 'commentaire' => 'Discussion partenariat', 'statut' => 'Confirmé'],
            ['date' => '22/10/2026', 'heure' => '10:00', 'prospect' => 'Mamy Rasoanaivo', 'contact' => '033 98 765 43', 'mode' => 'Téléphonique', 'lieu' => '-', 'commentaire' => 'Relance devis speaker', 'statut' => 'En attente'],
            ['date' => '23/10/2026', 'heure' => '11:30', 'prospect' => 'SoftLabs', 'contact' => '034 56 789 01', 'mode' => 'Visio', 'lieu' => 'Zoom', 'commentaire' => 'Démo Softio', 'statut' => 'Confirmé'],
        ];
        foreach ($rdvs as $r) {
            RendezVous::firstOrCreate(['prospect' => $r['prospect'], 'date' => $r['date'], 'heure' => $r['heure']], $r);
        }

        // 5. Ventes
        $ventes = [
            ['num' => 'VTE-2026-0001', 'type' => 'Produit', 'montant' => '360 000', 'date' => '16/10/2026', 'totalHT' => '300 000', 'tva' => '60 000', 'statut' => 'Validé'],
            ['num' => 'VTE-2026-0002', 'type' => 'Produit', 'montant' => '1 200 000', 'date' => '15/10/2026', 'totalHT' => '1 000 000', 'tva' => '200 000', 'statut' => 'Validé'],
            ['num' => 'VTE-2026-0003', 'type' => 'Service', 'montant' => '450 000', 'date' => '14/10/2026', 'totalHT' => '450 000', 'tva' => '0', 'statut' => 'Brouillon'],
            ['num' => 'VTE-2026-0004', 'type' => 'Produit', 'montant' => '2 400 000', 'date' => '12/10/2026', 'totalHT' => '2 000 000', 'tva' => '400 000', 'statut' => 'Validé'],
            ['num' => 'VTE-2026-0005', 'type' => 'Produit', 'montant' => '180 000', 'date' => '10/10/2026', 'totalHT' => '150 000', 'tva' => '30 000', 'statut' => 'Validé'],
        ];
        foreach ($ventes as $v) {
            Vente::updateOrCreate(['num' => $v['num']], $v);
        }

        // 6. Factures
        $factures = [
            ['num' => '2026-0010', 'type' => 'Facture', 'montant' => '9 200 000', 'date' => '07/07/2026', 'totalHT' => '9 200 000', 'tva' => '0', 'statut' => 'Validée'],
            ['num' => '2026-0009', 'type' => 'Facture', 'montant' => '1 200 000', 'date' => '01/07/2026', 'totalHT' => '1 200 000', 'tva' => '0', 'statut' => 'Validée'],
            ['num' => '2026-0008', 'type' => 'Devis', 'montant' => '4 000 000', 'date' => '29/06/2026', 'totalHT' => '4 000 000', 'tva' => '0', 'statut' => 'Brouillon'],
            ['num' => '2026-0007', 'type' => 'Proforma', 'montant' => '2 500 000', 'date' => '20/06/2026', 'totalHT' => '2 500 000', 'tva' => '0', 'statut' => 'Validée'],
            ['num' => '2026-0006', 'type' => 'Facture', 'montant' => '850 000', 'date' => '15/06/2026', 'totalHT' => '850 000', 'tva' => '0', 'statut' => 'Validée'],
        ];
        foreach ($factures as $f) {
            Facture::updateOrCreate(['num' => $f['num']], $f);
        }

        // 7. Produits
        $produits = [
            ['ref' => 'PS-001', 'designation' => 'Power Station 300wh', 'type' => 'Produit', 'prix' => '600 000', 'stock' => 12],
            ['ref' => 'PS-002', 'designation' => 'Power Station 1000wh', 'type' => 'Produit', 'prix' => '1 950 000', 'stock' => 5],
            ['ref' => 'SP-001', 'designation' => 'Speaker Champignon', 'type' => 'Produit', 'prix' => '10 000', 'stock' => 48],
            ['ref' => 'SP-002', 'designation' => 'Speaker Standard', 'type' => 'Produit', 'prix' => '18 000', 'stock' => 30],
            ['ref' => 'GT-001', 'designation' => 'Gourde Thermos', 'type' => 'Produit', 'prix' => '11 000', 'stock' => 25],
            ['ref' => 'SV-001', 'designation' => 'Formation Softio', 'type' => 'Service', 'prix' => '250 000', 'stock' => null],
            ['ref' => 'SV-002', 'designation' => 'Installation & Configuration', 'type' => 'Service', 'prix' => '150 000', 'stock' => null],
        ];
        foreach ($produits as $p) {
            Produit::updateOrCreate(['ref' => $p['ref']], $p);
        }

        // 8. Mouvements Stock
        $mouvements = [
            ['ref' => 'PS-001', 'designation' => 'Power Station 300wh', 'quantite' => 10, 'date' => '18/10/2026', 'type' => 'Entrée'],
            ['ref' => 'SP-001', 'designation' => 'Speaker Champignon', 'quantite' => 25, 'date' => '17/10/2026', 'type' => 'Entrée'],
            ['ref' => 'PS-002', 'designation' => 'Power Station 1000wh', 'quantite' => 3, 'date' => '15/10/2026', 'type' => 'Sortie'],
            ['ref' => 'GT-001', 'designation' => 'Gourde Thermos', 'quantite' => 15, 'date' => '14/10/2026', 'type' => 'Entrée'],
            ['ref' => 'SP-002', 'designation' => 'Speaker Standard', 'quantite' => 8, 'date' => '12/10/2026', 'type' => 'Sortie'],
        ];
        foreach ($mouvements as $m) {
            MouvementStock::firstOrCreate(['ref' => $m['ref'], 'date' => $m['date'], 'quantite' => $m['quantite']], $m);
        }

        // 9. SAV Tickets
        $tickets = [
            ['num' => 'SAV-2026-001', 'client' => 'Jean Rakoto', 'sujet' => 'Problème de charge Power Station', 'priorite' => 'Haute', 'statut' => 'Ouvert', 'date' => '20/10/2026'],
            ['num' => 'SAV-2026-002', 'client' => "Nir'Info", 'sujet' => 'Demande de remplacement speaker', 'priorite' => 'Moyenne', 'statut' => 'En cours', 'date' => '19/10/2026'],
            ['num' => 'SAV-2026-003', 'client' => 'Mamy Rasoanaivo', 'sujet' => 'Question sur la garantie', 'priorite' => 'Basse', 'statut' => 'Résolu', 'date' => '18/10/2026'],
            ['num' => 'SAV-2026-004', 'client' => 'SoftLabs', 'sujet' => 'Produit défectueux à la réception', 'priorite' => 'Haute', 'statut' => 'Ouvert', 'date' => '17/10/2026'],
            ['num' => 'SAV-2026-005', 'client' => 'Tiana', 'sujet' => 'Demande de facture', 'priorite' => 'Basse', 'statut' => 'Résolu', 'date' => '15/10/2026'],
        ];
        foreach ($tickets as $t) {
            SavTicket::updateOrCreate(['num' => $t['num']], $t);
        }

        // 10. Commerciaux
        $commerciaux = [
            ['nom' => 'Randria', 'prenom' => 'Hasina', 'email' => 'hasina@nirinfo.mg', 'contact' => '034 55 281 46', 'prospects' => 42, 'ventes' => 18],
            ['nom' => 'Mamy', 'prenom' => 'Nirina', 'email' => 'niryinfo@gmail.com', 'contact' => '034 70 840 46', 'prospects' => 35, 'ventes' => 12],
            ['nom' => 'Fitiavantsoa', 'prenom' => 'Fenohery', 'email' => 'fitiavantsoa@email.com', 'contact' => '034 40 053 83', 'prospects' => 28, 'ventes' => 9],
            ['nom' => 'Sitrakiniaina', 'prenom' => 'Sarobidy', 'email' => 'sarobidy@email.com', 'contact' => '033 51 347 87', 'prospects' => 21, 'ventes' => 7],
        ];
        foreach ($commerciaux as $c) {
            Commercial::updateOrCreate(['email' => $c['email']], $c);
        }

        // 11. Intérêts
        $interets = [
            ['prospect' => 'Jean Rakoto', 'type' => 'particulier', 'produit' => 'Power Station 1000wh', 'typeOffre' => 'Produit', 'date' => '18/10/2026', 'niveau' => 'Élevé', 'commentaire' => 'Très intéressé, demande un devis rapidement'],
            ['prospect' => "Nir'Info", 'type' => 'entreprise', 'produit' => 'Speaker Champignon', 'typeOffre' => 'Produit', 'date' => '17/10/2026', 'niveau' => 'Moyen', 'commentaire' => "Souhaite comparer avec d'autres modèles"],
            ['prospect' => 'Mamy Rasoanaivo', 'type' => 'particulier', 'produit' => 'Formation Softio', 'typeOffre' => 'Service', 'date' => '15/10/2026', 'niveau' => 'Élevé', 'commentaire' => 'Besoin de formation pour son équipe'],
            ['prospect' => 'SoftLabs', 'type' => 'entreprise', 'produit' => 'Power Station 300wh', 'typeOffre' => 'Produit', 'date' => '12/10/2026', 'niveau' => 'Faible', 'commentaire' => "Simple prise d'information"],
            ['prospect' => 'Faly Andrianasolo', 'type' => 'particulier', 'produit' => 'Gourde Thermos', 'typeOffre' => 'Produit', 'date' => '10/10/2026', 'niveau' => 'Moyen', 'commentaire' => 'Intéressé par le pack'],
        ];
        foreach ($interets as $in) {
            Interet::firstOrCreate(['prospect' => $in['prospect'], 'produit' => $in['produit'], 'date' => $in['date']], $in);
        }

        // 12. Closings
        $closings = [
            ['offre' => 'Speaker', 'description' => 'Livraison effectuée au domicile', 'montant' => '18 000', 'client' => 'Client', 'email' => '-', 'editeur' => 'Admin'],
            ['offre' => 'Power station 1000wh', 'description' => 'Remis au transporteur par taxi', 'montant' => '1 950 000', 'client' => 'Client', 'email' => '-', 'editeur' => 'Admin'],
            ['offre' => 'Power station 300wh', 'description' => 'Récupérée au siège de Mada', 'montant' => '600 000', 'client' => 'Njiva', 'email' => '-', 'editeur' => 'Admin'],
            ['offre' => 'Power station 300wh', 'description' => 'Livraison effectuée au domicile', 'montant' => '750 000', 'client' => 'Tiana', 'email' => '-', 'editeur' => 'Admin'],
            ['offre' => 'Speaker champignon', 'description' => "Achat d'une speaker champignon", 'montant' => '10 000', 'client' => 'Client', 'email' => '-', 'editeur' => 'Admin'],
        ];
        foreach ($closings as $cl) {
            Closing::firstOrCreate(['offre' => $cl['offre'], 'client' => $cl['client'], 'montant' => $cl['montant']], $cl);
        }

        // 13. Bibliothèque
        $fichiers = [
            ['nom' => 'Presentation Softio.pptx', 'type' => 'pptx', 'taille' => '2.4 MB', 'date' => '20/10/2026'],
            ['nom' => 'Catalogue produits.pdf', 'type' => 'pdf', 'taille' => '5.1 MB', 'date' => '18/10/2026'],
            ['nom' => 'Liste clients.xlsx', 'type' => 'xlsx', 'taille' => '340 KB', 'date' => '15/10/2026'],
            ['nom' => 'Photo équipe.png', 'type' => 'png', 'taille' => '1.8 MB', 'date' => '12/10/2026'],
            ['nom' => 'Contrat type.docx', 'type' => 'docx', 'taille' => '89 KB', 'date' => '10/10/2026'],
        ];
        foreach ($fichiers as $fi) {
            BibliothequeFichier::firstOrCreate(['nom' => $fi['nom']], $fi);
        }
    }
}
