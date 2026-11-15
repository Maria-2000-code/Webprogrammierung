package de.projekt.backend;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/benutzer")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class BenutzerController {

    private final BenutzerRepository benutzerRepository;
    private final BenutzerService benutzerService;
    
    // Konstruktor
    public BenutzerController(BenutzerRepository benutzerRepository, BenutzerService benutzerService) {
        this.benutzerRepository = benutzerRepository;
        this.benutzerService = benutzerService;
    }
    
    // Login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginDaten, HttpServletRequest request) {
        String benutzername = loginDaten.get("benutzername");
        String passwort = loginDaten.get("passwort");

        Benutzer benutzer = benutzerRepository.findByBenutzername(benutzername).orElse(null);

        if (benutzer == null) {
            return ResponseEntity.status(401).body("Ungültige Anmeldedaten");
        }

        String dbPasswort = benutzer.getPasswortHash();
        boolean passwortKorrekt = false;

        if (dbPasswort != null) {
            if (dbPasswort.equals(passwort)) {
                passwortKorrekt = true;
            } else if (dbPasswort.startsWith("$2a$") || dbPasswort.startsWith("$2b$") || dbPasswort.startsWith("$2y$")) {
                BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
                passwortKorrekt = encoder.matches(passwort, dbPasswort);
            }
        }

        if (!passwortKorrekt) {
            return ResponseEntity.status(401).body("Ungültige Anmeldedaten");
        }

        // Zwei-Faktor-Code prüfen, wenn der Benutzer 2FA eingerichtet hat
        if (benutzer.isZweiFaktorAktiv()) {
            String code = loginDaten.get("code");
            if (code == null || code.isBlank()) {
                return ResponseEntity.status(401).body(Map.of("status", "ZWEI_FAKTOR_ERFORDERLICH"));
            }
            if (!benutzerService.istZweiFaktorCodeGueltig(benutzer, code.trim())) {
                return ResponseEntity.status(401).body(Map.of("status", "ZWEI_FAKTOR_CODE_UNGUELTIG"));
            }
        }
        
        String rolle = benutzer.getRolle() != null ? benutzer.getRolle().name().trim() : "MITARBEITER";
        List<GrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority(rolle));

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(benutzername, null, authorities);

        SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
        securityContext.setAuthentication(authentication);
        SecurityContextHolder.setContext(securityContext);

        HttpSession session = request.getSession(true);
        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, securityContext);

        return ResponseEntity.ok(Map.of(
                "status", "ERFOLGREICH",
                "benutzerId", benutzer.getBenutzerId(),
                "rolle", rolle
        ));
    }
    
    // Alle Benutzer laden
    @GetMapping
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public List<Benutzer> alleBenutzerLaden() {
        return benutzerRepository.findAll();
    }
    
    // Alle aktiven Nutzer anzeigen
    @GetMapping("/aktiv-liste")
    @PreAuthorize("hasAnyAuthority('ADMINISTRATOR', 'PROJEKTLEITER')")
    public List<Benutzer> aktiveBenutzerLaden() {
        try {
            return benutzerRepository.findAll().stream()
                    .filter(Benutzer::isAktiv)
                    .toList();
        } catch (Exception e) {
            return benutzerRepository.findAll();
        }
    }

    // Benutzer anlegen
    @PostMapping
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public ResponseEntity<?> benutzerAnlegen(@RequestBody Benutzer benutzer) {
        try {
            return ResponseEntity.ok(benutzerService.benutzerAnlegen(benutzer));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    // Benutzer aktualisieren
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public ResponseEntity<?> benutzerAktualisieren(@PathVariable Long id, @RequestBody Benutzer benutzer) {
        try {
            return ResponseEntity.ok(benutzerService.benutzerAktualisieren(id, benutzer));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    // Aktuellen Benutzer anzeigen
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> aktuellerBenutzer(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }

        Benutzer benutzer = benutzerRepository.findByBenutzername(principal.getName()).orElse(null);
        if (benutzer == null) {
            return ResponseEntity.status(404).body("Benutzer nicht gefunden.");
        }

        return ResponseEntity.ok(Map.of(
                "benutzerId", benutzer.getBenutzerId(),
                "benutzername", benutzer.getBenutzername(),
                "email", benutzer.getEmail(),
                "rolle", benutzer.getRolle() != null ? benutzer.getRolle().name() : "MITARBEITER",
                "aktiv", benutzer.isAktiv(),
                "zweiFaktorAktiv", benutzer.isZweiFaktorAktiv()
        ));
    }

    // Zwei-Faktor-Setup
    @PostMapping("/me/2fa/setup")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> zweiFaktorSetup(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            return ResponseEntity.ok(benutzerService.zweiFaktorEinrichten(principal.getName()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }
    
 // Zwei-Faktor aktivieren
    @PostMapping("/me/2fa/aktivieren")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> zweiFaktorAktivieren(@RequestBody Map<String, String> daten, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            boolean erfolgreich = benutzerService.zweiFaktorAktivieren(principal.getName(), daten.get("code"));
            if (!erfolgreich) {
                return ResponseEntity.badRequest().body("Der Code ist ungültig.");
            }
            return ResponseEntity.ok(Map.of("status", "AKTIV"));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }
    
    // Zwei-Faktor deaktivieren
    @PostMapping("/me/2fa/deaktivieren")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> zweiFaktorDeaktivieren(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            benutzerService.zweiFaktorDeaktivieren(principal.getName());
            return ResponseEntity.ok(Map.of("status", "INAKTIV"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }
}