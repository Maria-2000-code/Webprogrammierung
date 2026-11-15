package de.projekt.backend;

import org.springframework.stereotype.Service;

@Service
public class AufgabeService {

    private final AufgabeRepository aufgabeRepository;
    private final ProjektRepository projektRepository;
    private final BenutzerRepository benutzerRepository;
    
    // Konstruktor
    public AufgabeService(AufgabeRepository aufgabeRepository, ProjektRepository projektRepository, BenutzerRepository benutzerRepository) {
        this.aufgabeRepository = aufgabeRepository;
        this.projektRepository = projektRepository;
        this.benutzerRepository = benutzerRepository;
    }

    // Neue Aufgabe erstellen (POST)
    public Aufgabe speichereAufgabe(Aufgabe aufgabe) {
        valibriereUndVervollstaendigeAufgabe(aufgabe);
        return aufgabeRepository.save(aufgabe);
    }

    // Bestehende Aufgabe aktualisieren (PUT)
    public Aufgabe aktualisiereAufgabe(Long id, Aufgabe aufgabeDetails) {
        Aufgabe bestehendeAufgabe = aufgabeRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Aufgabe mit ID " + id + " nicht gefunden"));

        bestehendeAufgabe.setTitel(aufgabeDetails.getTitel());
        bestehendeAufgabe.setBeschreibung(aufgabeDetails.getBeschreibung());
        bestehendeAufgabe.setStatus(aufgabeDetails.getStatus());
        bestehendeAufgabe.setStartDatum(aufgabeDetails.getStartDatum());
        bestehendeAufgabe.setEndDatum(aufgabeDetails.getEndDatum());

        if (aufgabeDetails.getProjekt() != null && aufgabeDetails.getProjekt().getProjektId() != null) {
            Long projektId = aufgabeDetails.getProjekt().getProjektId();
            Projekt projekt = projektRepository.findById(projektId)
                .orElseThrow(() -> new RuntimeException("Das zugehörige Projekt mit ID " + projektId + " wurde nicht gefunden."));
            bestehendeAufgabe.setProjekt(projekt);
        }

        if (aufgabeDetails.getBenutzer() != null && aufgabeDetails.getBenutzer().getBenutzerId() != null) {
            Long benutzerId = aufgabeDetails.getBenutzer().getBenutzerId();
            Benutzer benutzer = benutzerRepository.findById(benutzerId)
                .orElseThrow(() -> new RuntimeException("Benutzer mit ID " + benutzerId + " wurde nicht gefunden."));
            bestehendeAufgabe.setBenutzer(benutzer);
        }

        if (bestehendeAufgabe.getTitel() == null || bestehendeAufgabe.getTitel().trim().isEmpty()) {
            throw new IllegalArgumentException("Der Titel der Aufgabe darf nicht leer sein.");
        }

        return aufgabeRepository.save(bestehendeAufgabe);
    }
    
    // Aufgabe auf Vollständigkeit überprüfen
    private void valibriereUndVervollstaendigeAufgabe(Aufgabe aufgabe) {
        if (aufgabe.getTitel() == null || aufgabe.getTitel().trim().isEmpty()) {
            throw new IllegalArgumentException("Der Titel der Aufgabe darf nicht leer sein.");
        }
        if (aufgabe.getProjekt() == null || aufgabe.getProjekt().getProjektId() == null) {
            throw new IllegalArgumentException("Eine Aufgabe muss zwingend einem Projekt zugeordnet sein.");
        }
        Long projektId = aufgabe.getProjekt().getProjektId();
        Projekt projekt = projektRepository.findById(projektId)
            .orElseThrow(() -> new RuntimeException("Das zugehörige Projekt mit ID " + projektId + " wurde nicht gefunden."));
        aufgabe.setProjekt(projekt);

        if (aufgabe.getBenutzer() != null && aufgabe.getBenutzer().getBenutzerId() != null) {
            Long benutzerId = aufgabe.getBenutzer().getBenutzerId();
            Benutzer benutzer = benutzerRepository.findById(benutzerId)
                .orElseThrow(() -> new RuntimeException("Benutzer mit ID " + benutzerId + " wurde nicht gefunden."));
            aufgabe.setBenutzer(benutzer);
        } else {
            throw new RuntimeException("Eine Aufgabe muss einem gültigen Bearbeiter zugeordnet sein.");
        }
    }

    // Status einer Aufgabe ändern
    public Aufgabe statusAendern(Long aufgabenId, AufgabenStatus neuerStatus) {
        Aufgabe aufgabe = aufgabeRepository.findById(aufgabenId)
            .orElseThrow(() -> new RuntimeException("Aufgabe mit ID " + aufgabenId + " nicht gefunden"));
        aufgabe.setStatus(neuerStatus);
        return aufgabeRepository.save(aufgabe);
    }
}