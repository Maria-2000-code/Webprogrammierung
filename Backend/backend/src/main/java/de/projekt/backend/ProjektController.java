package de.projekt.backend;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/projekte")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ProjektController {

    private final ProjektService projektService;
    
    // Konstruktor
    public ProjektController(ProjektService projektService) {
        this.projektService = projektService;
    }
    
    // Alle Projekte anzeigen
    @GetMapping
    public List<Projekt> alleProjekteLaden(Principal principal) {
        if (principal == null) {
            return List.of();
        }
        return projektService.ladeProjekteFuerBenutzer(principal.getName());
    }
    
    // Projekte nach Id laden
    @GetMapping("/{id}")
    public ResponseEntity<?> projektLadenNachId(@PathVariable Long id, Principal principal) {
        try {
            Projekt projekt = projektService.ladeAlleProjekte().stream()
                    .filter(p -> p.getProjektId() != null && p.getProjektId().equals(id))
                    .findFirst()
                    .orElse(null);

            if (projekt == null) {
                return ResponseEntity.status(404).body("Projekt mit ID " + id + " nicht gefunden.");
            }

            if (principal == null || !projektService.istBeteiligt(projekt, principal.getName())) {
                return ResponseEntity.status(403).body("Kein Zugriff auf dieses Projekt.");
            }

            return ResponseEntity.ok(projekt);
        } catch (Exception e) {
            return ResponseEntity.status(404).body("Fehler beim Laden: " + e.getMessage());
        }
    }
    
    // Projekt erstellen
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMINISTRATOR', 'PROJEKTLEITER')")
    public ResponseEntity<?> projektErstellen(@RequestBody Projekt projekt, Principal principal) {
        try {
            Projekt neu = projektService.speichereProjekt(projekt);
            return ResponseEntity.ok(neu);
        } catch (Exception e) {
            return ResponseEntity.status(403).body("Keine Berechtigung zum Erstellen: " + e.getMessage());
        }
    }
    
    // Projekt aktualisieren
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMINISTRATOR', 'PROJEKTLEITER')")
    public ResponseEntity<?> projektAktualisieren(@PathVariable Long id, @RequestBody Projekt projektDetails, Principal principal) {
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("=== SECURITY DEBUG (PUT /api/projekte/" + id + ") ===");
        System.out.println("Principal / Name: " + (auth != null ? auth.getName() : "NICHT EINGELOGGT"));
        System.out.println("Authorities (Rollen): " + (auth != null ? auth.getAuthorities() : "KEINE"));

        try {
            Projekt aktualisiert = projektService.aktualisiereProjekt(id, projektDetails);
            return ResponseEntity.ok(aktualisiert);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(403).body("Zugriff verweigert: " + e.getMessage());
        }
    }
    
    //Mitarbeiter einem Projekt zuordnen
    @PostMapping("/{projektId}/mitarbeiter/{benutzerId}")
    @PreAuthorize("hasAnyAuthority('ADMINISTRATOR', 'PROJEKTLEITER')")
    public ResponseEntity<String> mitarbeiterZuordnen(
            @PathVariable Long projektId, 
            @PathVariable Long benutzerId) {
        projektService.mitarbeiterZuordnen(projektId, benutzerId);
        return ResponseEntity.ok("Mitarbeiter erfolgreich dem Projekt zugeordnet.");
    }
}