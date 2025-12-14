export function normalizeUser(id, data) {
    return {
      id,
      name: data.name || "",
      email: data.email || "",
      createdAt: data.createdAt || null,
      ...data
    };
  }
  