package de.projekt.backend;

import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.ArrayList;

@Service
public class ProjektService {

    private final ProjektRepository projektRepository;
    private final ProjektMitarbeiterRepository projektmitarbeiterRepository;
    private final BenutzerRepository benutzerRepository;
    
    // Konstruktor
    public ProjektService(ProjektRepository projektRepository, ProjektMitarbeiterRepository projektmitarbeiterRepository, BenutzerRepository benutzerRepository) {
        this.projektRepository = projektRepository;
        this.projektmitarbeiterRepository = projektmitarbeiterRepository;
        this.benutzerRepository = benutzerRepository;
    }
    
    // Projekt speichern
    @Transactional
    public Projekt speichereProjekt(Projekt projekt) {
        if (projekt.getBenutzer() != null && projekt.getBenutzer().getBenutzerId() != null) {
            Long leiterId = projekt.getBenutzer().getBenutzerId();
            Benutzer leiter = benutzerRepository.findById(leiterId)
                .orElseThrow(() -> new RuntimeException("Projektleiter mit ID " + leiterId + " nicht gefunden"));
            projekt.setBenutzer(leiter);
        } else {
            throw new RuntimeException("Kein gültiger Projektleiter zugewiesen.");
        }

        List<ProjektMitarbeiter> uebertrageneZuordnungen = projekt.getMitarbeiterZuordnungen();
        projekt.setMitarbeiterZuordnungen(new ArrayList<>());

        Projekt gespeichertesProjekt = projektRepository.save(projekt);

        if (uebertrageneZuordnungen != null) {
            for (ProjektMitarbeiter pm : uebertrageneZuordnungen) {
                if (pm.getBenutzer() != null && pm.getBenutzer().getBenutzerId() != null) {
                    Benutzer b = benutzerRepository.findById(pm.getBenutzer().getBenutzerId()).orElse(null);
                    if (b != null) {
                        ProjektMitarbeiter neueZuordnung = new ProjektMitarbeiter(gespeichertesProjekt, b);
                        gespeichertesProjekt.getMitarbeiterZuordnungen().add(neueZuordnung);
                    }
                }
            }
        }

        return projektRepository.save(gespeichertesProjekt);
    }
    
    // Projekt aktualisieren
    @Transactional
    public Projekt aktualisiereProjekt(Long id, Projekt projektDetails) {
        Projekt bestehendesProjekt = projektRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Projekt mit ID " + id + " nicht gefunden"));

        if (projektDetails.getBenutzer() != null && projektDetails.getBenutzer().getBenutzerId() != null) {
            Long leiterId = projektDetails.getBenutzer().getBenutzerId();
            Benutzer leiter = benutzerRepository.findById(leiterId)
                .orElseThrow(() -> new RuntimeException("Projektleiter mit ID " + leiterId + " nicht gefunden"));
            bestehendesProjekt.setBenutzer(leiter);
        }

        if (bestehendesProjekt.getMitarbeiterZuordnungen() != null && !bestehendesProjekt.getMitarbeiterZuordnungen().isEmpty()) {
            projektmitarbeiterRepository.deleteAll(bestehendesProjekt.getMitarbeiterZuordnungen());
            bestehendesProjekt.getMitarbeiterZuordnungen().clear();
            projektmitarbeiterRepository.flush();
        }

        if (projektDetails.getMitarbeiterZuordnungen() != null) {
            for (ProjektMitarbeiter pm : projektDetails.getMitarbeiterZuordnungen()) {
                if (pm.getBenutzer() != null && pm.getBenutzer().getBenutzerId() != null) {
                    Benutzer b = benutzerRepository.findById(pm.getBenutzer().getBenutzerId()).orElse(null);
                    if (b != null) {
                        ProjektMitarbeiter neueZuordnung = new ProjektMitarbeiter(bestehendesProjekt, b);
                        bestehendesProjekt.getMitarbeiterZuordnungen().add(neueZuordnung);
                    }
                }
            }
        }

        bestehendesProjekt.setName(projektDetails.getName());
        bestehendesProjekt.setBeschreibung(projektDetails.getBeschreibung());
        bestehendesProjekt.setAuftraggeber(projektDetails.getAuftraggeber());
        bestehendesProjekt.setStartDatum(projektDetails.getStartDatum());
        bestehendesProjekt.setEndDatum(projektDetails.getEndDatum());
        bestehendesProjekt.setArchiviert(projektDetails.isArchiviert());

        return projektRepository.save(bestehendesProjekt);
    }
    
    // Mitarbeiter einem Projekt zuordnen
    public ProjektMitarbeiter mitarbeiterZuordnen(Long projektId, Long benutzerId) {
        Projekt projekt = projektRepository.findById(projektId)
            .orElseThrow(() -> new RuntimeException("Projekt mit ID " + projektId + " nicht gefunden"));
    
        Benutzer benutzer = benutzerRepository.findById(benutzerId)
            .orElseThrow(() -> new RuntimeException("Benutzer mit ID " + benutzerId + " nicht gefunden"));
            
        ProjektMitarbeiter zuordnung = new ProjektMitarbeiter(projekt, benutzer);
        return projektmitarbeiterRepository.save(zuordnung);
    }
    
    // Nur Projekte laden, bei denen der angemeldete Nutzer MItarbeiter ist
    @Transactional
    public List<Projekt> ladeProjekteFuerBenutzer(String benutzername) {
        if (benutzername == null) {
            return List.of();
        }

        return projektRepository.findAll().stream()
            .filter(p -> istBeteiligt(p, benutzername))
            .toList();
    }

    // Prüft, ob der Benutzer Projektleiter oder zugeordneter Mitarbeiter des Projekts ist
    public boolean istBeteiligt(Projekt projekt, String benutzername) {
        if (projekt == null || benutzername == null) {
            return false;
        }

        if (projekt.getBenutzer() != null
                && benutzername.equals(projekt.getBenutzer().getBenutzername())) {
            return true;
        }

        if (projekt.getMitarbeiterZuordnungen() == null) {
            return false;
        }

        return projekt.getMitarbeiterZuordnungen().stream()
            .anyMatch(pm -> pm.getBenutzer() != null
                    && benutzername.equals(pm.getBenutzer().getBenutzername()));
    }
    
    // Alle Projekte laden
    public List<Projekt> ladeAlleProjekte() {
        return projektRepository.findAll();
    }
}