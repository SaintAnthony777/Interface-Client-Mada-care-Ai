import { Hospital } from '../types';

export const HOSPITALS_DATABASE: Record<string, Hospital[]> = {
    "Antsirabe": [
        { name: "CHRR Andranomadio", type: "Hopitaly Be (Public)", contact: "034 05 524 12" },
        { name: "Clinique NEXT", type: "Privé", contact: "034 11 222 33" },
        { name: "Hôpital luthérien (FLM) Ambohibary", type: "Confessionnel", contact: "032 04 123 45" },
        { name: "Polyclinique d'Antsirabe", type: "Privé", contact: "034 07 456 78" }
    ],
    "Antananarivo": [
        { name: "HJRA Ampefiloha", type: "Hopitaly Be (Public)", contact: "020 22 279 79" },
        { name: "CHUR JRF Befelatanana", type: "Public", contact: "020 22 223 84" },
        { name: "Hôpital Militaire (HOMI) Soavinandriana", type: "Militaire/Public", contact: "020 22 397 51" },
        { name: "Polyclinique Ilafy", type: "Privé", contact: "032 07 243 01" }
    ],
    // ... Ajoutez les autres villes ici
};
