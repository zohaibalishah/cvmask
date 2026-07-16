let cvStore;

if (process.env.NODE_ENV === "production") {
  cvStore = new Map();
} else {
  if (!global.cvStore) {
    global.cvStore = new Map();
  }
  cvStore = global.cvStore;
}

export { cvStore };
