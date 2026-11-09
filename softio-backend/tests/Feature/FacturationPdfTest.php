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
            'type' => 'facture',
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

        $pdfData = [
            'document' => $document,
            'company' => (object) [
                'nom_entreprise' => 'Softio',
                'adresse' => 'Antananarivo',
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
            'companySignaturePath' => null,
            'editorName' => 'Admin Test',
            'clientName' => 'Client Test',
            'typeLabel' => 'Facture',
            'lineSubtotal' => 12000,
            'vatAmount' => 0,
            'amountInWords' => 'Douze mille',
            'format' => 'A4',
            'barcodeSvg' => null,
            'options' => [],
        ];
        $pdfBytes = Pdf::loadView('pdf.facturation', $pdfData)->setPaper('a4')->output();
        $ticketPdfBytes = Pdf::loadView('pdf.facturation', [
            ...$pdfData,
            'format' => 'Ticket',
            'barcodeSvg' => '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="20"><rect x="0" y="0" width="100" height="20" fill="#000000"/></svg>',
        ])->setPaper([0, 0, 226.77, 524])->output();
        $invoiceHtml = preg_replace('/\s+/', ' ', view('pdf.facturation', $pdfData)->render()) ?: '';
        $layoutHtml = view('pdf.facturation', [
            ...$pdfData,
            'companyCachetPath' => __FILE__,
            'companySignaturePath' => __FILE__,
            'options' => [
                'stampWidth' => 240,
                'stampX' => 10,
                'signatureWidth' => 120,
                'signatureY' => 8,
            ],
        ])->render();

        $emailHtml = view('emails.facturation', [
            'document' => $document,
            'clientName' => 'Client Test',
            'companyName' => 'Softio',
            'typeLabel' => 'Facture',
            'document' => $document,
        ])->render();

        $this->assertStringStartsWith('%PDF-', $pdfBytes);
        $this->assertStringStartsWith('%PDF-', $ticketPdfBytes);
        preg_match_all('/\/Type\s*\/Page\b/', $ticketPdfBytes, $ticketPages);
        $this->assertCount(1, $ticketPages[0]);
        $this->assertStringContainsString('Antananarivo le 04/11/2026', $invoiceHtml);
        $this->assertStringContainsString('width: 240px; left: 28px;', $layoutHtml);
        $this->assertStringContainsString('width: 120px; left: 38px; top: 18px;', $layoutHtml);
        $this->assertStringContainsString('pièce jointe', $emailHtml);
        $this->assertStringContainsString('2026-0001', $emailHtml);
    }
}
