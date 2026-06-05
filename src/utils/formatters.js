export function calculateAge(birthDateString) {
  if (!birthDateString) return "";
  const birthDate = new Date(birthDateString);
  const today = new Date();
  if (isNaN(birthDate.getTime())) return "";

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? String(age) : "";
}

export function formatCPF(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  let formatted = digits;
  if (digits.length > 9) {
    formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  } else if (digits.length > 6) {
    formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  } else if (digits.length > 3) {
    formatted = `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }
  return formatted;
}

export function formatPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  let formatted = digits;
  if (digits.length > 10) {
    formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  } else if (digits.length > 6) {
    formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  } else if (digits.length > 2) {
    formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  } else if (digits.length > 0) {
    formatted = `(${digits}`;
  }
  return formatted;
}

export function formatSUS(value) {
  const digits = value.replace(/\D/g, "").slice(0, 15);
  let formatted = digits;
  if (digits.length > 11) {
    formatted = `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7, 11)} ${digits.slice(11)}`;
  } else if (digits.length > 7) {
    formatted = `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
  } else if (digits.length > 3) {
    formatted = `${digits.slice(0, 3)} ${digits.slice(3)}`;
  }
  return formatted;
}

export function formatNIS(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  let formatted = digits;
  if (digits.length > 10) {
    formatted = `${digits.slice(0, 3)}.${digits.slice(3, 8)}.${digits.slice(8, 10)}-${digits.slice(10)}`;
  } else if (digits.length > 8) {
    formatted = `${digits.slice(0, 3)}.${digits.slice(3, 8)}.${digits.slice(8)}`;
  } else if (digits.length > 3) {
    formatted = `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }
  return formatted;
}
