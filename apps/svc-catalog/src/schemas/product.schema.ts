import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import type { Document, Types } from "mongoose"
import { Transform } from "class-transformer"

export type ProductDocument = Product & Document

export enum ProductType {
  SIMPLE = "simple",
  VARIABLE = "variable",
  GROUPED = "grouped",
  EXTERNAL = "external",
  DIGITAL = "digital",
  SUBSCRIPTION = "subscription",
}

export enum ProductStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  INACTIVE = "inactive",
  ARCHIVED = "archived",
}

export enum ProductVisibility {
  PUBLIC = "public",
  PRIVATE = "private",
  HIDDEN = "hidden",
}

@Schema({ _id: false })
export class ProductCategory {
  @Prop({ required: true })
  id: string

  @Prop({ required: true })
  name: string

  @Prop({ required: true })
  slug: string

  @Prop({ default: 0 })
  level: number
}

@Schema({ _id: false })
export class ProductImage {
  @Prop({ required: true })
  id: string

  @Prop({ required: true })
  url: string

  @Prop()
  alt?: string

  @Prop()
  title?: string

  @Prop({ default: 0 })
  position: number

  @Prop({ default: false })
  isPrimary: boolean
}

@Schema({ _id: false })
export class ProductVariant {
  @Prop({ required: true })
  id: string

  @Prop({ required: true })
  sku: string

  @Prop()
  name?: string

  @Prop({ type: Object })
  attributes: Record<string, any>

  @Prop({ type: Object })
  pricing: {
    regular: number
    sale?: number
    cost?: number
  }

  @Prop({ type: Object })
  inventory: {
    tracked: boolean
    quantity: number
    lowStockThreshold: number
  }

  @Prop([String])
  images: string[]

  @Prop()
  weight?: number

  @Prop({ type: Object })
  dimensions?: {
    length: number
    width: number
    height: number
  }
}

@Schema({ _id: false })
export class ProductSEO {
  @Prop({ maxlength: 60 })
  title?: string

  @Prop({ maxlength: 160 })
  description?: string

  @Prop([String])
  keywords: string[]

  @Prop()
  canonicalUrl?: string
}

@Schema({ _id: false })
export class ProductBrand {
  @Prop({ required: true })
  id: string

  @Prop({ required: true })
  name: string

  @Prop({ required: true })
  slug: string

  @Prop()
  logo?: string
}

@Schema({ _id: false })
export class ProductReviews {
  @Prop({ default: 0, min: 0, max: 5 })
  averageRating: number

  @Prop({ default: 0, min: 0 })
  totalReviews: number

  @Prop({ type: Object })
  ratingDistribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}

@Schema({ timestamps: true })
export class Product {
  @Transform(({ value }) => value.toString())
  _id: Types.ObjectId

  // Basic Information
  @Prop({ required: true, maxlength: 255 })
  name: string

  @Prop({ required: true, unique: true, match: /^[a-z0-9-]+$/ })
  slug: string

  @Prop()
  description?: string

  @Prop({ maxlength: 500 })
  shortDescription?: string

  // Product Classification
  @Prop({ required: true, enum: ProductType })
  type: ProductType

  @Prop({ required: true, enum: ProductStatus, default: ProductStatus.DRAFT })
  status: ProductStatus

  @Prop({ enum: ProductVisibility, default: ProductVisibility.PUBLIC })
  visibility: ProductVisibility

  // Categorization
  @Prop({ type: [ProductCategory] })
  categories: ProductCategory[]

  @Prop([String])
  tags: string[]

  // SEO Information
  @Prop({ type: ProductSEO })
  seo?: ProductSEO

  // Media
  @Prop({ type: [ProductImage] })
  images: ProductImage[]

  // Variants (for variable products)
  @Prop({ type: [ProductVariant] })
  variants: ProductVariant[]

  // Attributes (flexible product properties)
  @Prop({ type: Object })
  attributes: Record<string, any>

  // Brand Information
  @Prop({ type: ProductBrand })
  brand?: ProductBrand

  // Reviews and Ratings
  @Prop({ type: ProductReviews })
  reviews: ProductReviews

  // Metadata
  @Prop({ type: Object })
  metadata: Record<string, any>

  // Timestamps
  @Prop({ default: Date.now })
  createdAt: Date

  @Prop({ default: Date.now })
  updatedAt: Date

  @Prop()
  publishedAt?: Date
}

export const ProductSchema = SchemaFactory.createForClass(Product)

// Create indexes
ProductSchema.index({ slug: 1 }, { unique: true })
ProductSchema.index({ status: 1 })
ProductSchema.index({ type: 1 })
ProductSchema.index({ visibility: 1 })
ProductSchema.index({ "categories.id": 1 })
ProductSchema.index({ "categories.slug": 1 })
ProductSchema.index({ tags: 1 })
ProductSchema.index({ "brand.id": 1 })
ProductSchema.index({ "variants.sku": 1 })
ProductSchema.index({ "reviews.averageRating": -1 })
ProductSchema.index({ createdAt: -1 })
ProductSchema.index({ updatedAt: -1 })

// Text search index
ProductSchema.index(
  {
    name: "text",
    description: "text",
    shortDescription: "text",
    tags: "text",
    "brand.name": "text",
    "categories.name": "text",
  },
  {
    weights: {
      name: 10,
      tags: 5,
      "brand.name": 3,
      "categories.name": 2,
      description: 1,
      shortDescription: 1,
    },
    name: "product_search_index",
  },
)

// Compound indexes for common queries
ProductSchema.index({ status: 1, visibility: 1, createdAt: -1 })
ProductSchema.index({ "categories.id": 1, status: 1, "reviews.averageRating": -1 })
