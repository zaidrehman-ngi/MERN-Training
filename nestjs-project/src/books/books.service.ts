import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CreateBookDto } from './dto/create-book.dto.js';
import { UpdateBookDto } from './dto/update-book.dto.js';
import { Book } from './entities/book.entity.js';

@Injectable()
export class BooksService {
  private books: Book[] = [];

  create(createBookDto: CreateBookDto): Book {
    this.checkIsbnFree(createBookDto.isbn);

    const { title, author, year, isbn, totalCopies, finePerDay } =
      createBookDto;
    const book: Book = {
      id: randomUUID(),
      title,
      author,
      year,
      isbn,
      totalCopies,
      finePerDay,
    };
    this.books.push(book);
    return book;
  }

  findAll(): Book[] {
    return this.books;
  }

  findOne(id: string): Book {
    const book = this.books.find((b) => b.id === id);
    if (!book) {
      throw new NotFoundException(`Book ${id} not found`);
    }
    return book;
  }

  update(id: string, updateBookDto: UpdateBookDto): Book {
    const book = this.findOne(id);
    if (updateBookDto.isbn && updateBookDto.isbn !== book.isbn) {
      this.checkIsbnFree(updateBookDto.isbn);
    }

    Object.assign(book, updateBookDto);
    return book;
  }

  remove(id: string): void {
    const book = this.findOne(id);
    this.books = this.books.filter((b) => b !== book);
  }

  private checkIsbnFree(isbn: string) {
    if (this.books.some((b) => b.isbn === isbn)) {
      throw new ConflictException(`A book with ISBN ${isbn} already exists`);
    }
  }
}
