// Recipe Book — database initialisation (MongoDB 7, mongosh)
//
// Run against the Docker container:
//   docker compose exec mongo mongosh recipebook /scripts/init-db.js
//
// Safe to re-run: creates missing collections, (re)applies validators,
// creates indexes, and inserts any missing categories.
// This file is the only place indexes are created (Mongoose autoIndex:false,
// Beanie declares no indexes).

/* ---------- helpers ---------- */

const str = (min, max) => ({ bsonType: "string", minLength: min, maxLength: max });
const num = (min, max) => {
  const n = { bsonType: "number", minimum: min };
  if (max !== undefined) n.maximum = max;
  return n;
};
const optional = (schema) => ({ ...schema, bsonType: [].concat(schema.bsonType, "null") });
const oneOf = (values) => ({ bsonType: "string", enum: values });
const date = { bsonType: "date" };
const oid = { bsonType: "objectId" };

const image = {
  bsonType: "object",
  required: ["url", "publicId"],
  properties: { url: str(1, 500), publicId: str(1, 300) },
};

/* ---------- validators ---------- */

const schemas = {
  users: {
    bsonType: "object",
    required: ["name", "email", "passwordHash", "role", "createdAt"],
    properties: {
      name: str(1, 100),
      email: { bsonType: "string", pattern: "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$" },
      passwordHash: str(20, 200),
      role: oneOf(["user", "admin"]),
      createdAt: date,
    },
  },

  categories: {
    bsonType: "object",
    required: ["slug", "name", "order"],
    properties: {
      slug: { bsonType: "string", pattern: "^[a-z0-9]+(-[a-z0-9]+)*$" },
      name: str(1, 60),
      imageUrl: optional(str(1, 500)),
      order: num(0),
    },
  },

  recipes: {
    bsonType: "object",
    required: [
      "title", "dishName", "author", "foodType", "category", "difficulty", "servings",
      "prepTimeMin", "cookTimeMin", "images", "ingredients", "instructions",
      "avgRating", "reviewCount", "likeCount", "createdAt", "updatedAt",
    ],
    properties: {
      title: str(3, 120),
      description: optional(str(0, 500)),
      dishName: str(2, 80),
      author: oid,
      foodType: oneOf(["veg", "nonveg"]),
      category: { bsonType: "string" },
      difficulty: oneOf(["easy", "medium", "hard"]),
      servings: num(1, 50),
      prepTimeMin: num(0, 1440),
      cookTimeMin: num(0, 1440),
      images: { bsonType: "array", minItems: 1, maxItems: 3, items: image },
      ingredients: {
        bsonType: "array",
        minItems: 1,
        maxItems: 40,
        items: {
          bsonType: "object",
          required: ["name"],
          properties: {
            name: str(1, 60),
            quantity: optional(num(0)),
            unit: optional(str(0, 20)),
            note: optional(str(0, 60)),
          },
        },
      },
      instructions: {
        bsonType: "array",
        minItems: 1,
        maxItems: 8,
        items: {
          bsonType: "object",
          required: ["steps"],
          properties: {
            section: optional(str(0, 40)),
            steps: {
              bsonType: "array",
              minItems: 1,
              maxItems: 30,
              items: {
                bsonType: "object",
                required: ["text"],
                properties: {
                  text: str(3, 600),
                  durationMin: optional(num(0, 1440)),
                  tip: optional(str(0, 200)),
                },
              },
            },
          },
        },
      },
      avgRating: num(0, 5),
      reviewCount: num(0),
      likeCount: num(0),
      createdAt: date,
      updatedAt: date,
    },
  },

  reviews: {
    bsonType: "object",
    required: ["recipe", "user", "rating", "createdAt"],
    properties: {
      recipe: oid,
      user: oid,
      rating: num(1, 5),
      comment: optional(str(0, 1000)),
      createdAt: date,
    },
  },

  likes: {
    bsonType: "object",
    required: ["user", "recipe", "createdAt"],
    properties: { user: oid, recipe: oid, createdAt: date },
  },
};

const existing = db.getCollectionNames();
for (const [name, schema] of Object.entries(schemas)) {
  const options = { validator: { $jsonSchema: schema }, validationLevel: "strict", validationAction: "error" };
  if (existing.includes(name)) {
    db.runCommand({ collMod: name, ...options });
    print(`validator updated: ${name}`);
  } else {
    db.createCollection(name, options);
    print(`collection created: ${name}`);
  }
}

/* ---------- indexes ---------- */

const indexes = {
  users: [
    [{ email: 1 }, { name: "users_email_unique", unique: true }],
  ],
  categories: [
    [{ slug: 1 }, { name: "categories_slug_unique", unique: true }],
  ],
  recipes: [
    [{ title: "text", dishName: "text" }, { name: "recipes_text", weights: { title: 5, dishName: 3 } }],
    [{ category: 1, foodType: 1, createdAt: -1 }, { name: "recipes_category_foodType_createdAt" }],
    [{ foodType: 1, createdAt: -1 }, { name: "recipes_foodType_createdAt" }],
    [{ author: 1, createdAt: -1 }, { name: "recipes_author_createdAt" }],
  ],
  reviews: [
    [{ recipe: 1, user: 1 }, { name: "reviews_recipe_user_unique", unique: true }],
    [{ recipe: 1, createdAt: -1 }, { name: "reviews_recipe_createdAt" }],
  ],
  likes: [
    [{ user: 1, recipe: 1 }, { name: "likes_user_recipe_unique", unique: true }],
    [{ user: 1, createdAt: -1 }, { name: "likes_user_createdAt" }],
    [{ recipe: 1 }, { name: "likes_recipe" }],
    [{ createdAt: -1 }, { name: "likes_createdAt" }],
  ],
};

for (const [coll, list] of Object.entries(indexes)) {
  for (const [keys, opts] of list) db.getCollection(coll).createIndex(keys, opts);
  print(`indexes ready: ${coll} (${list.length})`);
}

/* ---------- categories ---------- */

const categories = [
  ["paneer", "Paneer"],
  ["chicken", "Chicken"],
  ["egg", "Egg"],
  ["potato", "Potato"],
  ["mutton", "Mutton"],
  ["fish-seafood", "Fish & Seafood"],
  ["dal-lentils", "Dal & Lentils"],
  ["rice-biryani", "Rice & Biryani"],
  ["mushroom", "Mushroom"],
  ["sweets-desserts", "Sweets & Desserts"],
];

categories.forEach(([slug, name], i) => {
  db.categories.updateOne(
    { slug },
    { $setOnInsert: { slug, name, imageUrl: null, order: i + 1 } },
    { upsert: true },
  );
});
print(`categories ready: ${categories.length}`);
print("Done.");
