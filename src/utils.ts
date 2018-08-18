import { RenderableProps } from "preact";

/*
 * Extracts the children from the props and returns an object containing the
 * only element of the given array (preact always passes children as an array)
 * or null otherwise. The result contains always a reference to the original
 * array of children
 *
 * @param {RenderableProps<*>} props - the component's properties
 * @return {{ child: JSX.Element | null, children: JSX.Element[]}}
 */
export function getChildren(props: RenderableProps<any>) {
  const children = props.children as JSX.Element[];
  const child = children.length === 1 ? children[0] : null;
  return { child, children };
}
