import asyncHandler from "express-async-handler";
import CarModel from "../models/carModel.js";

// helper to safely parse JSON strings from form-data
const parseJSONField = (field) => {
  if (!field) return undefined;
  if (typeof field === "object") return field;

  try {
    return JSON.parse(field);
  } catch {
    return field;
  }
};

// @desc    Add new car
// @route   POST /api/cars
// @access  Private/Admin
const addCars = asyncHandler(async (req, res) => {
  const {
    name,
    slug,
    price,
    currency,
    year,
    description,
    shortDescription,
    category,
    condition,
    availability,
    stock,
    featured,
    warranty,
    rating,
    reviewCount,
    isPublished,
  } = req.body;

  const uploadedPictures = req.files?.map((file) => file.path) || [];

  const specifications = parseJSONField(req.body.specifications);
  const dimensions = parseJSONField(req.body.dimensions);
  const colors = parseJSONField(req.body.colors);
  const features = parseJSONField(req.body.features);
  const safetyFeatures = parseJSONField(req.body.safetyFeatures);
  const technologyFeatures = parseJSONField(req.body.technologyFeatures);

  if (
    !name ||
    !slug ||
    !price ||
    !year ||
    !description ||
    uploadedPictures.length === 0
  ) {
    res.status(400);
    throw new Error("Please provide all required fields including car images");
  }

  const existingCar = await CarModel.findOne({ slug });
  if (existingCar) {
    res.status(400);
    throw new Error("Car with this slug already exists");
  }

  const car = await CarModel.create({
    name,
    slug,
    price,
    currency,
    year,
    description,
    shortDescription,
    pictures: uploadedPictures,
    category,
    condition,
    availability,
    stock,
    featured,
    specifications,
    dimensions,
    colors,
    features,
    safetyFeatures,
    technologyFeatures,
    warranty,
    rating,
    reviewCount,
    isPublished,
  });

  res.status(201).json(car);
});

// @desc    Edit car details
// @route   PUT /api/cars/:id
// @access  Private/Admin
const editCarDetails = asyncHandler(async (req, res) => {
  const car = await CarModel.findById(req.params.id);

  if (!car) {
    res.status(404);
    throw new Error("Car not found");
  }

  if (req.body.slug && req.body.slug !== car.slug) {
    const slugExists = await CarModel.findOne({
      slug: req.body.slug,
      _id: { $ne: car._id },
    });

    if (slugExists) {
      res.status(400);
      throw new Error("Another car with this slug already exists");
    }
  }

  const uploadedPictures = req.files?.map((file) => file.path) || [];

  const specifications = parseJSONField(req.body.specifications);
  const dimensions = parseJSONField(req.body.dimensions);
  const colors = parseJSONField(req.body.colors);
  const features = parseJSONField(req.body.features);
  const safetyFeatures = parseJSONField(req.body.safetyFeatures);
  const technologyFeatures = parseJSONField(req.body.technologyFeatures);

  car.name = req.body.name ?? car.name;
  car.slug = req.body.slug ?? car.slug;
  car.price = req.body.price ?? car.price;
  car.currency = req.body.currency ?? car.currency;
  car.year = req.body.year ?? car.year;
  car.description = req.body.description ?? car.description;
  car.shortDescription = req.body.shortDescription ?? car.shortDescription;
  car.category = req.body.category ?? car.category;
  car.condition = req.body.condition ?? car.condition;
  car.availability = req.body.availability ?? car.availability;
  car.stock = req.body.stock ?? car.stock;
  car.featured =
    req.body.featured !== undefined
      ? req.body.featured === "true" || req.body.featured === true
      : car.featured;
  car.warranty = req.body.warranty ?? car.warranty;
  car.rating = req.body.rating ?? car.rating;
  car.reviewCount = req.body.reviewCount ?? car.reviewCount;
  car.isPublished =
    req.body.isPublished !== undefined
      ? req.body.isPublished === "true" || req.body.isPublished === true
      : car.isPublished;

  if (uploadedPictures.length > 0) {
    car.pictures = uploadedPictures;
  }

  if (specifications !== undefined) car.specifications = specifications;
  if (dimensions !== undefined) car.dimensions = dimensions;
  if (colors !== undefined) car.colors = colors;
  if (features !== undefined) car.features = features;
  if (safetyFeatures !== undefined) car.safetyFeatures = safetyFeatures;
  if (technologyFeatures !== undefined)
    car.technologyFeatures = technologyFeatures;

  const updatedCar = await car.save();
  res.status(200).json(updatedCar);
});

// @desc    Get all cars
// @route   GET /api/cars
// @access  Public
const getCars = asyncHandler(async (req, res) => {
  const cars = await CarModel.find({}).sort({ createdAt: -1 });
  res.status(200).json(cars);
});

// @desc    Get single car by ID
// @route   GET /api/cars/:id
// @access  Public
const getCarById = asyncHandler(async (req, res) => {
  const car = await CarModel.findById(req.params.id);

  if (!car) {
    res.status(404);
    throw new Error("Car not found");
  }

  res.status(200).json(car);
});

// @desc    Delete car
// @route   DELETE /api/cars/:id
// @access  Private/Admin
const deleteCar = asyncHandler(async (req, res) => {
  const car = await CarModel.findById(req.params.id);

  if (!car) {
    res.status(404);
    throw new Error("Car not found");
  }

  await car.deleteOne();

  res.status(200).json({ message: "Car deleted successfully" });
});

export {
  addCars,
  editCarDetails,
  getCars,
  getCarById,
  deleteCar,
};