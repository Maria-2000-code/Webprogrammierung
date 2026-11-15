package de.projekt.backend;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/aufgaben")
@CrossOrigin(origins = "http://localhost:5173", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
public class AufgabeController {

    private final AufgabeService aufgabeService;
    private final AufgabeRepository aufgabeRepository;
    
    // Konstruktor
    public AufgabeController(AufgabeService aufgabeService, AufgabeRepository aufgabeRepository) {
        this.aufgabeService = aufgabeService;
        this.aufgabeRepository = aufgabeRepository;
    }
    
    // Alle Aufgaben laden
    @GetMapping
    public List<Aufgabe> alleAufgabenLaden() {
        return aufgabeRepository.findAll();
    }

    // Aufgabe erstellen
    @PostMapping
    public Aufgabe aufgabeErstellen(@RequestBody Aufgabe aufgabe) {
        return aufgabeService.speichereAufgabe(aufgabe);
    }
    
    // Geänderte Aufgabe aktualisieren
    @PutMapping("/{id}")
    public ResponseEntity<?> aufgabeAktualisieren(@PathVariable Long id, @RequestBody Aufgabe aufgabeDetails) {
        try {
            Aufgabe aktualisiert = aufgabeService.aktualisiereAufgabe(id, aufgabeDetails);
            return ResponseEntity.ok(aktualisiert);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Fehler beim Aktualisieren der Aufgabe: " + e.getMessage());
        }
    }
}