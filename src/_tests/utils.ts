import expect from "expect";

export function html(el: HTMLElement, selector?: string) {
  if (!selector) {
    return el.innerHTML;
  }

  const elements = el.querySelectorAll(selector);
  expect(elements.length).toEqual(1);
  return elements[0].innerHTML;
}
