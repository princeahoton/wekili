import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Profile from '../pages/Profile';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../services/api', () => ({
  getProfile:             vi.fn().mockResolvedValue({ profile: null }),
  saveProfile:            vi.fn().mockResolvedValue({ profile: {} }),
  sendProfilePhoneOTP:    vi.fn().mockResolvedValue({ success: true }),
  verifyProfilePhoneOTP:  vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('../utils/auth', () => ({
  getUser: vi.fn().mockReturnValue({ id: 1, prenom: 'Alice', nom: 'Test', email: 'alice@test.com' }),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

async function renderProfile() {
  let result;
  await act(async () => {
    result = render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );
  });
  return result;
}

function getNationaliteSelect() {
  // Le premier <select> dans le formulaire correspond à "Nationalité"
  return screen.getAllByRole('combobox')[0];
}

function getPhoneInput() {
  return screen.getByPlaceholderText('+229 97 00 00 00');
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Profile — auto-remplissage de l\'indicatif téléphonique', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('remplit le champ téléphone avec +229 lors du choix de Bénin', async () => {
    await renderProfile();
    fireEvent.change(getNationaliteSelect(), { target: { value: 'Bénin', name: 'nationalite' } });
    expect(getPhoneInput().value).toBe('+229 ');
  });

  it("remplit le champ téléphone avec +221 lors du choix de Sénégal", async () => {
    await renderProfile();
    fireEvent.change(getNationaliteSelect(), { target: { value: 'Sénégal', name: 'nationalite' } });
    expect(getPhoneInput().value).toBe('+221 ');
  });

  it("remplit avec +225 pour Côte d'Ivoire", async () => {
    await renderProfile();
    fireEvent.change(getNationaliteSelect(), { target: { value: "Côte d'Ivoire", name: 'nationalite' } });
    expect(getPhoneInput().value).toBe('+225 ');
  });

  it("ne remplace pas un numéro déjà saisi", async () => {
    await renderProfile();
    // Saisir un numéro complet d'abord
    fireEvent.change(getPhoneInput(), { target: { value: '+229 97 00 00 00', name: 'telephone' } });
    // Changer le pays
    fireEvent.change(getNationaliteSelect(), { target: { value: 'Sénégal', name: 'nationalite' } });
    // Le numéro complet ne doit pas être écrasé
    expect(getPhoneInput().value).toBe('+229 97 00 00 00');
  });

  it("ne remplit pas pour 'Autre' (pas d'indicatif défini)", async () => {
    await renderProfile();
    fireEvent.change(getNationaliteSelect(), { target: { value: 'Autre', name: 'nationalite' } });
    expect(getPhoneInput().value).toBe('');
  });

  it('met à jour l\'indicatif si seul un code précédent est présent', async () => {
    await renderProfile();
    // Remplissage initial avec Bénin
    fireEvent.change(getNationaliteSelect(), { target: { value: 'Bénin', name: 'nationalite' } });
    expect(getPhoneInput().value).toBe('+229 ');
    // Changer vers Togo — le champ ne contient qu'un indicatif, donc il doit être remplacé
    fireEvent.change(getNationaliteSelect(), { target: { value: 'Togo', name: 'nationalite' } });
    expect(getPhoneInput().value).toBe('+228 ');
  });
});
