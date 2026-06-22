export default function getInitials(name) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initial1 = words[0] ? words[0].substring(0, 1) : "";
  const initial2 = words[1]
    ? words[1].substring(0, 1)
    : words[0]
      ? words[0].substring(1, 2)
      : "";
  return (initial1 + initial2).toUpperCase();
}
