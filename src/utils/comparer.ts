import { Expression, SpreadElement, ObjectLiteralElement } from '@typescript-eslint/types/dist/generated/ast-spec'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

export const getAstNodeTypeOrder = (type: AST_NODE_TYPES) => {
  const order = [AST_NODE_TYPES.Literal, AST_NODE_TYPES.Identifier].indexOf(type)
  const END_OF_ORDER = 2
  return order === -1 ? END_OF_ORDER : order
}

export const getLiteralTypeOrder = (
  type: 'undefined' | 'boolean' | 'number' | 'bigint' | 'string' | 'object' | 'symbol' | 'function',
) => {
  const order = ['undefined', 'boolean', 'number', 'bigint', 'string'].indexOf(type)
  const END_OF_ORDER = 5
  return order === -1 ? END_OF_ORDER : order
}

type Element = Expression | SpreadElement

const makeObjectComparer = ({ isReversed }: { isReversed: boolean }) => {
  const comparer = (l: ObjectLiteralElement, r: ObjectLiteralElement) => {
    if (l.type === AST_NODE_TYPES.Property && r.type === AST_NODE_TYPES.Property) {
      if (l.key.type === AST_NODE_TYPES.Literal && r.key.type === AST_NODE_TYPES.Literal) {
        // Both string should compare in dictionary order
        return l.key.value < r.key.value ? -1 : 1
      } else if (l.key.type === AST_NODE_TYPES.Identifier && r.key.type === AST_NODE_TYPES.Identifier) {
        // Computed key should place at right side (ex: { [KEY]: value })
        if (l.computed !== r.computed) {
          return l.computed ? 1 : -1
        }

        // Both string should compare in dictionary order
        return l.key.name < r.key.name ? -1 : 1
      } else {
        // Other types should sort as [AST_NODE_TYPES.Literal, AST_NODE_TYPES.Identifier, others]
        return getAstNodeTypeOrder(l.key.type) - getAstNodeTypeOrder(r.key.type)
      }
    } else {
      // Do not judge of keys order if cannot compare
      return 0
    }
  }

  return isReversed ? (l: ObjectLiteralElement, r: ObjectLiteralElement) => -comparer(l, r) : comparer
}

const makeArrayComparer = ({ isReversed }: { isReversed: boolean }) => {
  const comparer = (l: Element, r: Element) => {
    if (l.type === AST_NODE_TYPES.Literal && r.type === AST_NODE_TYPES.Literal) {
      if (typeof l.value !== typeof r.value) {
        // Number should place at left side
        return getLiteralTypeOrder(typeof l.value) - getLiteralTypeOrder(typeof r.value)
      } else if (typeof l.value === 'number' && typeof r.value === 'number') {
        // Both number should compare with numeric
        return l.value - r.value
      } else if (typeof l.value === 'string' && typeof r.value === 'string') {
        // Both string should compare in dictionary order
        return l.value < r.value ? -1 : 1
      } else {
        // Do not compare other types : bigint | boolean | RegExp
        return 0
      }
    } else if (l.type === AST_NODE_TYPES.Identifier && r.type === AST_NODE_TYPES.Identifier) {
      // Identifier should compare name with dictionary order
      return l.name < r.name ? -1 : 1
    } else if (l.type !== r.type) {
      // Other types should sort as [AST_NODE_TYPES.Literal, AST_NODE_TYPES.Identifier, others]
      return getAstNodeTypeOrder(l.type) - getAstNodeTypeOrder(r.type)
    } else {
      // Do not judge of values order if they are same type and cannot compare
      return 0
    }
  }

  return isReversed ? (l: Element, r: Element) => -comparer(l, r) : comparer
}

export const ComparerUtils = {
  makeObjectComparer,
  makeArrayComparer,
}
