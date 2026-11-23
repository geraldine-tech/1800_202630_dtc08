
import { db } from "./firebaseConfig.js";
import { doc, setDoc } from "firebase/firestore";

// Sample meals
const meals = [
    {
        id: "jollof-rice-chicken",
        mealName: "Jollof Rice with Grilled Chicken",
        mealType: "Lunch",
        description: "Nigerian jollof rice served with grilled chicken and plantain.",
        ingredients: ["Rice", "Tomatoes", "Pepper", "Onions", "Chicken", "Plantain"],
        estimatedCost: 1200,
        calories: 550,
        protein: 32,
        preparationTime: 40,
        servings: 2,
        dietaryTags: ["High Protein"],
        imageUrl: "/images/jollof-rice.jpg"
    },
    {
        id: "beans-porridge",
        mealName: "Nigerian Beans Porridge",
        mealType: "Lunch",
        description: "A hearty beans porridge cooked with vegetables and palm oil.",
        ingredients: ["Beans", "Palm oil", "Onions", "Pepper", "Spinach"],
        estimatedCost: 850,
        calories: 420,
        protein: 20,
        preparationTime: 50,
        servings: 2,
        dietaryTags: ["High Protein", "High Fiber"],
        imageUrl: "/images/beans-porridge.jpg"
    },
    {
        id: "moi-moi",
        mealName: "Moi Moi",
        mealType: "Breakfast",
        description: "Steamed Nigerian bean pudding rich in plant protein.",
        ingredients: ["Beans", "Pepper", "Onions", "Vegetable oil"],
        estimatedCost: 700,
        calories: 300,
        protein: 18,
        preparationTime: 45,
        servings: 2,
        dietaryTags: ["High Protein"],
        imageUrl: "/images/moi-moi.jpg"
    },
    {
        id: "chicken-rice-bowl",
        mealName: "Chicken Vegetable Rice Bowl",
        mealType: "Dinner",
        description: "A balanced rice bowl with chicken and fresh vegetables.",
        ingredients: ["Rice", "Chicken", "Carrots", "Broccoli", "Peas"],
        estimatedCost: 1100,
        calories: 480,
        protein: 35,
        preparationTime: 30,
        servings: 2,
        dietaryTags: ["High Protein"],
        imageUrl: "/images/chicken-rice-bowl.jpg"
    },
    {
        id: "salmon-sweet-potato",
        mealName: "Salmon with Sweet Potato",
        mealType: "Dinner",
        description: "Oven-baked salmon served with sweet potato and broccoli.",
        ingredients: ["Salmon", "Sweet potato", "Broccoli", "Olive oil"],
        estimatedCost: 1600,
        calories: 520,
        protein: 34,
        preparationTime: 35,
        servings: 1,
        dietaryTags: ["High Protein"],
        imageUrl: "/images/salmon-sweet-potato.jpg"
    },
    {
        id: "vegetable-omelette",
        mealName: "Vegetable Omelette Toast",
        mealType: "Breakfast",
        description: "A vegetable omelette served with whole wheat toast.",
        ingredients: ["Eggs", "Spinach", "Tomatoes", "Onions", "Whole wheat bread"],
        estimatedCost: 650,
        calories: 350,
        protein: 22,
        preparationTime: 15,
        servings: 1,
        dietaryTags: ["High Protein"],
        imageUrl: "/images/vegetable-omelette.jpg"
    }
];

// Add sample meals to Firestore
export async function addMeals() {
    for (const meal of meals) {
        const mealRef = doc(db, "meals", meal.id);

        const mealData = { ...meal };
        delete mealData.id;

        mealData.status = "approved";

        await setDoc(mealRef, mealData);
    }

    console.log("Sample meals added successfully!");
}