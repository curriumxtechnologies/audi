import mongoose from "mongoose";

const carModelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "USD",
      uppercase: true,
      trim: true,
    },

    year: {
      type: Number,
      required: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    shortDescription: {
      type: String,
      trim: true,
    },

    pictures: {
      type: [String],
      required: true,
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length >= 1 && value.length <= 5;
        },
        message: "Pictures must be between 1 and 5 images",
      },
    },

    category: {
      type: String,
      enum: ["sedan", "suv", "coupe", "convertible", "sportback", "wagon", "electric", "other"],
      default: "sedan",
    },

    condition: {
      type: String,
      enum: ["new", "used", "certified"],
      default: "new",
    },

    availability: {
      type: String,
      enum: ["available", "sold", "coming-soon", "out-of-stock"],
      default: "available",
    },

    stock: {
      type: Number,
      default: 1,
      min: 0,
    },

    featured: {
      type: Boolean,
      default: false,
    },

    specifications: {
      engine: {
        type: String,
        trim: true,
      },
      horsepower: {
        type: Number,
        min: 0,
      },
      torque: {
        type: String,
        trim: true,
      },
      transmission: {
        type: String,
        trim: true,
      },
      drivetrain: {
        type: String,
        trim: true,
      },
      fuelType: {
        type: String,
        enum: ["petrol", "diesel", "hybrid", "electric"],
      },
      batteryRange: {
        type: String,
        trim: true,
      },
      topSpeed: {
        type: String,
        trim: true,
      },
      acceleration: {
        type: String,
        trim: true,
      },
      mpg: {
        type: String,
        trim: true,
      },
      seatingCapacity: {
        type: Number,
        min: 1,
      },
      doors: {
        type: Number,
        min: 2,
      },
    },

    dimensions: {
      length: {
        type: String,
        trim: true,
      },
      width: {
        type: String,
        trim: true,
      },
      height: {
        type: String,
        trim: true,
      },
      wheelbase: {
        type: String,
        trim: true,
      },
      cargoSpace: {
        type: String,
        trim: true,
      },
      curbWeight: {
        type: String,
        trim: true,
      },
    },

    colors: {
      exterior: [
        {
          type: String,
          trim: true,
        },
      ],
      interior: [
        {
          type: String,
          trim: true,
        },
      ],
    },

    features: [
      {
        type: String,
        trim: true,
      },
    ],

    safetyFeatures: [
      {
        type: String,
        trim: true,
      },
    ],

    technologyFeatures: [
      {
        type: String,
        trim: true,
      },
    ],

    warranty: {
      type: String,
      trim: true,
    },

    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },

    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const CarModel = mongoose.model("CarModel", carModelSchema);

export default CarModel;