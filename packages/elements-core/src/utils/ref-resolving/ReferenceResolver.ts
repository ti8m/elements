import { getLastPathSegment, resolveInlineRef } from '@stoplight/json';
import { SchemaNodeKind } from '@stoplight/json-schema-tree';
import { Dictionary } from '@stoplight/types';

export type ReferenceInfo = {
  source: string | null;
  pointer: string | null;
};

export type ReferenceResolver = (ref: ReferenceInfo, propertyPath: string[] | null, currentObject?: object) => any;

export const defaultResolver =
  (contextObject: object): ReferenceResolver =>
  ({ pointer }, _, currentObject) => {
    const activeObject = contextObject ?? currentObject;

    if (pointer === null) {
      return null;
    }

    if (pointer === '#') {
      return activeObject;
    }

    const resolved = resolveInlineRef(activeObject as Dictionary<string>, pointer);

    if (resolved) {
      // For resolved objects from a pointer (i.e. referenced by $ref) we add a 'objectRefType' property.
      // The property value is the resolved type name.
      // The json-schema-viewer component can then evaluate this property and display more precise information if present.
      // Example: for '#/components/schemas/Foo' the property value is 'Foo'.
      // Addresses https://github.com/stoplightio/elements/issues/2762.
      if (typeof resolved === SchemaNodeKind.Object && pointer) {
        // @ts-ignore
        resolved.objectRefType = getLastPathSegment(pointer);
      }
      return resolved;
    }

    throw new ReferenceError(`Could not resolve '${pointer}`);
  };
