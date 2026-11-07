package uk.co.sperinservices.certificates;

import android.app.Activity;
import android.content.Context;
import android.net.Uri;
import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;
import android.print.PageRange;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintDocumentInfo;
import android.print.PrintManager;

import java.io.ByteArrayInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * Sends the original vector PDF bytes to Android PrintManager. Printing a WebView
 * or a raster preview instead introduces unwanted scaling and extra margins.
 * No image conversion, certificate edits, data migration or temporary APK files.
 */
public final class CertificatePdfPrinter {
    private CertificatePdfPrinter() {}

    private interface PdfSource {
        InputStream open() throws IOException;
    }

    public static void print(Activity activity, byte[] pdfBytes, int pageCount, boolean landscape) {
        if (pdfBytes == null || pdfBytes.length == 0) throw new IllegalArgumentException("PDF is empty");
        print(activity, () -> new ByteArrayInputStream(pdfBytes), pageCount, landscape);
    }

    public static void print(Activity activity, Uri uri, int pageCount, boolean landscape) {
        if (uri == null) throw new IllegalArgumentException("PDF address missing");
        print(activity, () -> {
            InputStream input = activity.getContentResolver().openInputStream(uri);
            if (input == null) throw new IOException("Unable to read PDF");
            return input;
        }, pageCount, landscape);
    }

    private static void print(Activity activity, PdfSource source, int pageCount, boolean landscape) {
        if (pageCount < 1 || pageCount > 500) throw new IllegalArgumentException("Invalid PDF page count");
        PrintManager manager = (PrintManager) activity.getSystemService(Context.PRINT_SERVICE);
        if (manager == null) throw new IllegalStateException("Android print service unavailable");

        PrintAttributes attributes = new PrintAttributes.Builder()
            .setMediaSize(landscape
                ? PrintAttributes.MediaSize.ISO_A4.asLandscape()
                : PrintAttributes.MediaSize.ISO_A4.asPortrait())
            // Do not stack software margins on top of the margins built into
            // the certificate. The physical printer still limits edge printing.
            .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
            // Landscape PDF pages must remain individually centred. Avoid
            // automatic front/back duplex shifts reported with this HP printer.
            .setDuplexMode(PrintAttributes.DUPLEX_MODE_NONE)
            .build();

        PrintDocumentAdapter adapter = new PrintDocumentAdapter() {
            @Override
            public void onLayout(PrintAttributes oldAttributes, PrintAttributes newAttributes,
                                 CancellationSignal cancellationSignal, LayoutResultCallback callback,
                                 android.os.Bundle extras) {
                if (cancellationSignal.isCanceled()) {
                    callback.onLayoutCancelled();
                    return;
                }
                PrintDocumentInfo document = new PrintDocumentInfo.Builder("Sperin-Certificate.pdf")
                    .setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT)
                    .setPageCount(pageCount)
                    .build();
                callback.onLayoutFinished(document, !newAttributes.equals(oldAttributes));
            }

            @Override
            public void onWrite(PageRange[] pages, ParcelFileDescriptor destination,
                                CancellationSignal cancellationSignal, WriteResultCallback callback) {
                // The print spool receives the original PDF unchanged, keeping
                // exact page geometry, vector text and the certificate border.
                new Thread(() -> {
                    try (InputStream input = source.open();
                         FileOutputStream output = new FileOutputStream(destination.getFileDescriptor())) {
                        byte[] buffer = new byte[16384];
                        int count;
                        while ((count = input.read(buffer)) != -1) {
                            if (cancellationSignal.isCanceled()) {
                                callback.onWriteCancelled();
                                return;
                            }
                            output.write(buffer, 0, count);
                        }
                        output.flush();
                        if (cancellationSignal.isCanceled()) callback.onWriteCancelled();
                        else callback.onWriteFinished(new PageRange[]{PageRange.ALL_PAGES});
                    } catch (Exception error) {
                        callback.onWriteFailed(error.getMessage() == null ? "Could not spool PDF" : error.getMessage());
                    } finally {
                        try { destination.close(); } catch (IOException ignored) {}
                    }
                }, "sperin-pdf-print").start();
            }
        };

        manager.print("Sperin Certificate", adapter, attributes);
    }
}
