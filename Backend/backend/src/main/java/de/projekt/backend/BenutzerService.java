package de.projekt.backend;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class BenutzerService {

    private final BenutzerRepository benutzerRepository;
    private final PasswordEncoder passwordEncoder;
    private final TotpService totpService;
    
    // Konstruktor
    public BenutzerService(BenutzerRepository benutzerRepository, PasswordEncoder passwordEncoder, TotpService totpService) {
        this.benutzerRepository = benutzerRepository;
        this.passwordEncoder = passwordEncoder;
        this.totpService = totpService;
    }

    // Benutzer anlegen
    public Benutzer benutzerAnlegen(Benutzer benutzer) {
        if (benutzer.getBenutzername() == null || benutzer.getBenutzername().trim().isEmpty()) {
            throw new IllegalArgumentException("Der Name darf nicht leer sein.");
        }

        if (benutzerRepository.existsByBenutzername(benutzer.getBenutzername())) {
            throw new IllegalArgumentException("Dieser Benutzername ist bereits vergeben.");
        }

        if (benutzer.getEmail() == null || benutzer.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Die E-Mail-Adresse darf nicht leer sein.");
        }

        if (benutzerRepository.existsByEmail(benutzer.getEmail())) {
            throw new IllegalArgumentException("Diese E-Mail-Adresse ist bereits vergeben.");
        }

        if (benutzer.getPasswortHash() != null && !benutzer.getPasswortHash().isEmpty()) {
            String gehashtesPasswort = passwordEncoder.encode(benutzer.getPasswortHash());
            benutzer.setPasswortHash(gehashtesPasswort);
        }

        benutzer.setZweiFaktorAktiv(false);
        benutzer.setZweiFaktorSecret(null);

        return benutzerRepository.save(benutzer);
    }

    // Benutzer aktualisieren
    public Benutzer benutzerAktualisieren(Long benutzerId, Benutzer benutzerDetails) {
        Benutzer benutzer = benutzerRepository.findById(benutzerId)
            .orElseThrow(() -> new RuntimeException("Benutzer mit ID " + benutzerId + " nicht gefunden"));

        benutzer.setBenutzername(benutzerDetails.getBenutzername());
        benutzer.setEmail(benutzerDetails.getEmail());
        benutzer.setAktiv(benutzerDetails.isAktiv());
        benutzer.setRolle(benutzerDetails.getRolle());

        String neuesPasswort = benutzerDetails.getPasswortHash();
        if (neuesPasswort != null && !neuesPasswort.trim().isEmpty()
                && !neuesPasswort.equals(benutzer.getPasswortHash())) {
            benutzer.setPasswortHash(passwordEncoder.encode(neuesPasswort));
        }

        return benutzerRepository.save(benutzer);
    }

    // Rolle zuweisen
    public Benutzer rolleZuweisen(Long benutzerId, Rolle neueRolle) {
        Benutzer benutzer = benutzerRepository.findById(benutzerId)
            .orElseThrow(() -> new RuntimeException("Benutzer mit ID " + benutzerId + " nicht gefunden"));

        benutzer.setRolle(neueRolle);

        return benutzerRepository.save(benutzer);
    }

    public Map<String, String> zweiFaktorEinrichten(String benutzername) {
        Benutzer benutzer = ladeNachName(benutzername);

        if (benutzer.isZweiFaktorAktiv()) {
            throw new IllegalStateException("Die Zwei-Faktor-Authentifizierung ist bereits aktiv.");
        }

        String geheimnis = totpService.neuesGeheimnis();
        benutzer.setZweiFaktorSecret(geheimnis);
        benutzerRepository.save(benutzer);

        return Map.of(
                "secret", geheimnis,
                "otpauthUrl", totpService.otpauthUrl(benutzer.getBenutzername(), geheimnis)
        );
    }
    
    // Zwei-Faktor aktivieren
    public boolean zweiFaktorAktivieren(String benutzername, String code) {
        Benutzer benutzer = ladeNachName(benutzername);

        if (benutzer.getZweiFaktorSecret() == null) {
            throw new IllegalStateException("Die Einrichtung wurde noch nicht gestartet.");
        }

        if (!totpService.istCodeGueltig(benutzer.getZweiFaktorSecret(), code)) {
            return false;
        }

        benutzer.setZweiFaktorAktiv(true);
        benutzerRepository.save(benutzer);
        return true;
    }
    
    // Zwei-Faktor deaktivieren
    public void zweiFaktorDeaktivieren(String benutzername) {
        Benutzer benutzer = ladeNachName(benutzername);
        benutzer.setZweiFaktorAktiv(false);
        benutzer.setZweiFaktorSecret(null);
        benutzerRepository.save(benutzer);
    }

    // Zwei-Faktor-Code gültig?
    public boolean istZweiFaktorCodeGueltig(Benutzer benutzer, String code) {
        return totpService.istCodeGueltig(benutzer.getZweiFaktorSecret(), code);
    }

    private Benutzer ladeNachName(String benutzername) {
        return benutzerRepository.findByBenutzername(benutzername)
            .orElseThrow(() -> new RuntimeException("Benutzer " + benutzername + " nicht gefunden"));
    }
}