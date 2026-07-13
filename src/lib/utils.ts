export function calculateAge(dateOfBirth: Date | null | undefined) {
  if (!dateOfBirth) return null;
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
  ) {
    age--;
  }
  return age;
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function fullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`;
}

export function statusLabel(status: string) {
  switch (status) {
    case "active":
      return "Active";
    case "matched":
      return "Matched";
    case "inactive":
      return "Inactive";
    case "pending":
      return "Pending";
    case "viewed":
      return "Viewed";
    case "archived":
      return "Archived";
    default:
      return status;
  }
}
