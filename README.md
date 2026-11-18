Vor Testung des Prototyps müssen folgende Sachen getan werden, damit dieser startet:

1. Bild unter folgenden Pfad einfügen: Frontend/src/assets/IU Logo.png (Dieses wurde bewusst nicht hochgeladen, da die Hochschule die Rechte besitzt.)
2. Die Datenbank steht in der .gitignore-Datei, wodurch keine Benutzenden angelegt sind. Dies müsste manuell über H2 erfolgen. Es sollte daran gedacht werden, dass die Passwörter über VCrypt gehasht sind, 
d.h. gehashtes Passwort muss beim INSERT-Befehl genutzt werden, bei der Anmeldung das Klarwort-Passwort.
