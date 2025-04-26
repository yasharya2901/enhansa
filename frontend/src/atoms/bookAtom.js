import { atom, selector } from 'recoil';

export const booksState = atom({
  key: 'booksState',
  default: [],
});

export const selectedBookState = atom({
  key: 'selectedBookState',
  default: null,
});

export const categoriesState = atom({
  key: 'categoriesState',
  default: ['Adventure', 'Crime', 'Fantasy', 'Horror'],
});

export const selectedCategoryState = atom({
  key: 'selectedCategoryState',
  default: null,
});

export const filteredBooksSelector = selector({
  key: 'filteredBooksSelector',
  get: ({get}) => {
    const books = get(booksState);
    const selectedCategory = get(selectedCategoryState);
    
    if (!selectedCategory) return books;
    return books.filter(book => book.genre === selectedCategory);
  },
});
