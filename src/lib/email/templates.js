// DEPRECATED: This file used to contain inline templates.
// It now re-exports the modular templates from ./templates/index to ensure
// a single source of truth and consistent rendering/layout.
// Please use `import * as T from './templates/index'` going forward.

export {
  default as orderCreated
} from './templates/orderCreated'

export {
  default as orderDue
} from './templates/orderDue'

export {
  default as orderStatus
} from './templates/orderStatus'

export {
  default as quoteReceived
} from './templates/quoteReceived'

export {
  default as quoteSelected
} from './templates/quoteSelected'

export {
  default as quoteCancelled
} from './templates/quoteCancelled'

export {
  default as newMessage
} from './templates/newMessage'