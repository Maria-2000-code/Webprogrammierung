package de.projekt.backend;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProjektRepository extends JpaRepository<Projekt, Long> {
    
    @Query("SELECT p FROM Projekt p JOIN p.mitarbeiterZuordnungen mz JOIN mz.benutzer b WHERE b.benutzername = :benutzername")
    List<Projekt> findByMitarbeiterZuordnungenBenutzer_Benutzername(@Param("benutzername") String benutzername);

}