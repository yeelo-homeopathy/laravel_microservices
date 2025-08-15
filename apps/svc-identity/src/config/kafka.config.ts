import { registerAs } from "@nestjs/config"

/**
 * Kafka Configuration for Identity Service
 *
 * Configures Kafka client settings for event streaming
 * between microservices in the e-commerce platform.
 */
export default registerAs("kafka", () => ({
  /**
   * Kafka broker endpoints
   */
  brokers: process.env.KAFKA_BROKERS?.split(",") || ["kafka:9092"],

  /**
   * Client identification
   */
  clientId: process.env.KAFKA_CLIENT_ID || "identity-service",

  /**
   * Topic prefix for namespacing
   */
  topicPrefix: process.env.KAFKA_TOPIC_PREFIX || "ecommerce",

  /**
   * Producer configuration
   */
  producer: {
    maxInFlightRequests: Number.parseInt(process.env.KAFKA_PRODUCER_MAX_IN_FLIGHT || "1"),
    idempotent: process.env.KAFKA_PRODUCER_IDEMPOTENT === "true",
    transactionTimeout: Number.parseInt(process.env.KAFKA_PRODUCER_TRANSACTION_TIMEOUT || "30000"),
    retry: {
      initialRetryTime: Number.parseInt(process.env.KAFKA_PRODUCER_INITIAL_RETRY_TIME || "100"),
      retries: Number.parseInt(process.env.KAFKA_PRODUCER_RETRIES || "3"),
      maxRetryTime: Number.parseInt(process.env.KAFKA_PRODUCER_MAX_RETRY_TIME || "30000"),
    },
  },

  /**
   * Consumer configuration
   */
  consumer: {
    groupId: process.env.KAFKA_CONSUMER_GROUP_ID || "identity-service-group",
    sessionTimeout: Number.parseInt(process.env.KAFKA_CONSUMER_SESSION_TIMEOUT || "30000"),
    heartbeatInterval: Number.parseInt(process.env.KAFKA_CONSUMER_HEARTBEAT_INTERVAL || "3000"),
    maxBytesPerPartition: Number.parseInt(process.env.KAFKA_CONSUMER_MAX_BYTES_PER_PARTITION || "1048576"),
    retry: {
      initialRetryTime: Number.parseInt(process.env.KAFKA_CONSUMER_INITIAL_RETRY_TIME || "100"),
      retries: Number.parseInt(process.env.KAFKA_CONSUMER_RETRIES || "8"),
      maxRetryTime: Number.parseInt(process.env.KAFKA_CONSUMER_MAX_RETRY_TIME || "30000"),
    },
  },

  /**
   * Connection settings
   */
  connection: {
    connectionTimeout: Number.parseInt(process.env.KAFKA_CONNECTION_TIMEOUT || "10000"),
    requestTimeout: Number.parseInt(process.env.KAFKA_REQUEST_TIMEOUT || "30000"),
    retry: {
      initialRetryTime: Number.parseInt(process.env.KAFKA_CONNECTION_INITIAL_RETRY_TIME || "100"),
      retries: Number.parseInt(process.env.KAFKA_CONNECTION_RETRIES || "8"),
      maxRetryTime: Number.parseInt(process.env.KAFKA_CONNECTION_MAX_RETRY_TIME || "30000"),
      factor: Number.parseFloat(process.env.KAFKA_CONNECTION_RETRY_FACTOR || "2"),
    },
  },

  /**
   * Dead letter queue configuration
   */
  deadLetterQueue: {
    enabled: process.env.KAFKA_DLQ_ENABLED === "true",
    topic: process.env.KAFKA_DLQ_TOPIC || "dead-letter-queue",
    maxRetries: Number.parseInt(process.env.KAFKA_DLQ_MAX_RETRIES || "3"),
  },

  /**
   * Topics to subscribe to
   */
  subscriptions: [
    "user-registered",
    "user-updated",
    "user-deleted",
    "order-created",
    "order-updated",
    "payment-processed",
    "inventory-updated",
  ],

  /**
   * Monitoring configuration
   */
  monitoring: {
    enabled: process.env.KAFKA_MONITORING_ENABLED === "true",
    metricsInterval: Number.parseInt(process.env.KAFKA_METRICS_INTERVAL || "60000"),
  },
}))
