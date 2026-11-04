<?php

namespace Tests\Feature;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class FacturationPdfTest extends TestCase
{
    public function test_invoice_pdf_and_polite_email_template_render(): void
    {
        $document = (object) [
            'date_devis' => Carbon::parse('2026-11-04'),
            'numero' => '2026-0001',
            'intitule' => 'Prestation de test',
            'remarque' => null,
            'remise_globale' => 0,
            'montant_ht' => 12000,
            'montant_ttc' => 12000,
            'inclure_tva' => false,
            'taux_tva' => 0,
            'client' => (object) [
                'entreprise' => null,
                'email' => 'client@example.test',
                'telephone' => '0340000000',
            ],
            'lignes' => collect([
                (object) [
                    'designation' => 'Service de test',
                    'quantite' => 1,
                    'prix_unitaire' => 12000,
                    'montant' => 12000,
                ],
            ]),
        ];

        $pdfBytes = Pdf::loadView('pdf.facturation', [
            'document' => $document,
            'company' => (object) [
                'nom_entreprise' => 'Softio',
                'adresse' => null,
                'telephone' => null,
                'email' => null,
                'nif' => null,
                'stat' => null,
                'rcs' => null,
                'logo' => null,
                'cachet' => null,
            ],
            'companyLogoPath' => null,
            'companyCachetPath' => null,
            'clientName' => 'Client Test',
            'typeLabel' => 'Facture',
            'lineSubtotal' => 12000,
            'vatAmount' => 0,
        ])->setPaper('a4')->output();

        $emailHtml = view('emails.facturation', [
            'clientName' => 'Client Test',
            'companyName' => 'Softio',
            'typeLabel' => 'Facture',
            'document' => $document,
        ])->render();

        $this->assertStringStartsWith('%PDF-', $pdfBytes);
        $this->assertStringContainsString('pièce jointe', $emailHtml);
        $this->assertStringContainsString('2026-0001', $emailHtml);
    }
}
