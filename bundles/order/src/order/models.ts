export interface Menu {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  menu: Menu;
  quantity: number;
}
