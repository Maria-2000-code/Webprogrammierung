package de.projekt.backend;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BenutzerRepository extends JpaRepository<Benutzer, Long> {
    boolean existsByEmail(String email); // 
    boolean existsByBenutzername(String benutzername); 
    
    Optional<Benutzer> findByBenutzername(String benutzername);
}
