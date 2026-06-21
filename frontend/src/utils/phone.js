export function normalisePhone(phone) {
  return (phone || '').replace(/[\s\-().]/g, '');
}

export function validatePhone(phone) {
  if (!phone) return null;
  const n = normalisePhone(phone);
  if (!n.startsWith('+')) return "Ajoutez le préfixe international (ex. : +229 97 00 00 00)";
  if (!/^\+[1-9][0-9]+$/.test(n)) return "Numéro invalide — chiffres uniquement après le +";
  if (n.length < 9)  return "Numéro trop court (minimum 8 chiffres après le +)";
  if (n.length > 16) return "Numéro trop long (maximum 15 chiffres)";
  return null;
}
