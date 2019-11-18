export class LinkedList<T extends {next: T | null}> {
  // tslint:disable-next-line:variable-name
  constructor(private _head: T) {}

  get(l: number) {
    let c: T | null = this._head;
    while (c && l > 0) {
      l--;
      c = c.next;
    }

    return c;
  }

  get head() { return this._head; }
  get length() {
    let c: T | null = this._head;
    let i = 0;
    while (c) {
      i++;
      c = c.next;
    }

    return i;
  }

  reduce<R>(accumulator: (acc: R, value: T, index?: number) => R, seed: R) {
    let c: T | null = this._head;
    let acc = seed;
    let i = 0;
    while (c) {
      acc = accumulator(acc, c, i);
      i++;
      c = c.next;
    }

    return acc;
  }

  find(predicate: (value: T, index?: number) => boolean) {
    let c: T | null = this._head;
    let i = 0;
    while (c) {
      if (predicate(c, i)) {
        break;
      }
      i++;
      c = c.next;
    }

    return c;
  }

  forEach(visitor: (value: T, index?: number) => void) {
    let c: T | null = this._head;
    let i = 0;
    while (c) {
      visitor(c, i);
      i++;
      c = c.next;
    }
  }
}

export class IndexOutOfBoundException  {
  constructor(index: number, min: number, max = Infinity) {
    throw new Error(`Index ${index} outside of range [${min}, ${max}].`);
  }
}

export class Chunk {
  private content: string | null;
  private left: string | null = '';
  private right: string | null = '';

  next: Chunk | null = null;

  constructor(public start: number, public end: number, public originalContent: string) {
    this.content = originalContent.slice(start, end);
  }

  get length() {
    return (this.left ? this.left.length : 0)
      + (this.content ? this.content.length : 0)
      + (this.right ? this.right.length : 0);
  }

  toString() {
    return (this.left ? this.left : '')
      + (this.content ? this.content : '')
      + (this.right ? this.right : '');
  }

  slice(start: number) {
    if (start < this.start || start > this.end) {
      throw new IndexOutOfBoundException(start, this.start, this.end);
    }

    // // Update _content to the new indices.
    const newChunk = new Chunk(start, this.end, this.originalContent);

    // If this chunk has _content, reslice the original _content. We move the _right so we are not
    // losing any data here. If this chunk has been deleted, the next chunk should also be deleted.
    if (this.content) {
      this.content = this.originalContent.slice(this.start, start);
    } else {
      newChunk.content = this.content;
      if (this.right === null) {
        newChunk.left = null;
      }
    }
    this.end = start;

    // Move _right to the new chunk.
    newChunk.right = this.right;
    this.right = this.right && '';

    // Update the linked list.
    newChunk.next = this.next;
    this.next = newChunk;

    return newChunk;
  }

  append(buffer: string) {
    this.right = `${this.right}${buffer}`;
  }

  prepend(buffer: string) {
    this.left = `${buffer}${this.left}`;
  }

  remove(left: boolean, content: boolean, right: boolean) {
    if (left) {
      this.left = null;
    }
    if (content) {
      this.content = null;
    }
    if (right) {
      this.right = null;
    }
  }

}

export class StringUpdater {
  protected linkedList: LinkedList<Chunk>;

  constructor(protected originalContent: string) {
    this.linkedList = new LinkedList(new Chunk(0, originalContent.length, originalContent));
  }

  protected _assertIndex(index: number) {
    if (index < 0 || index > this.originalContent.length) {
      throw new IndexOutOfBoundException(index, 0, this.originalContent.length);
    }
  }

  protected _slice(start: number): [Chunk, Chunk] {
    // If start is longer than the content, use start, otherwise determine exact position in string.
    const index = start >= this.originalContent.length ? start : this._getTextPosition(start);
    this._assertIndex(index);

    // Find the chunk by going through the list.
    const h = this.linkedList.find(chunk => index <= chunk.end);
    if (!h) {
      throw Error('Chunk cannot be found.');
    }

    if (index === h.end && h.next !== null) {
      return [h, h.next];
    }

    return [h, h.slice(index)];
  }

  /**
   * Gets the position in the content based on the position in the string.
   * Some characters might be wider than one byte, thus we have to determine the position using
   * string functions.
   */
  protected _getTextPosition(index: number): number {
    return this.originalContent.substring(0, index).length;
  }

  get length(): number {
    return this.linkedList.reduce((acc, chunk) => acc + chunk.length, 0);
  }
  get original(): string {
    return this.originalContent;
  }

  toString(): string {
    return this.linkedList.reduce((acc, chunk) => {
      return acc + chunk.toString();
    }, '');
  }


  insertLeft(index: number, content: string) {
    this._slice(index)[0].append(content);
  }

  insertRight(index: number, content: string) {
    this._slice(index)[1].prepend(content);
  }

  remove(index: number, length: number) {
    const end = index + length;

    const first = this._slice(index)[1];
    const last = this._slice(end)[1];
    let curr: Chunk | null;

    for (curr = first; curr && curr !== last; curr = curr.next) {
      curr.remove(curr !== first, curr !== last, curr === first);
    }

    if (curr) {
      curr.remove(true, false, false);
    }
  }
}
