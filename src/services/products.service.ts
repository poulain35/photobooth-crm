import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Product } from '../models/api.models';

const MOCK_PRODUCTS: Product[] = [
  { id: 'prod_01', name: 'Location Photobooth Classique (4h)', price: 450, description: 'Location de notre photobooth standard pour une durée de 4 heures.' },
  { id: 'prod_02', name: 'Livre d\'or personnalisé', price: 75, description: 'Un livre d\'or de haute qualité pour que les invités collent leurs photos et laissent un message.' },
  { id: 'prod_03', name: 'Frais de déplacement', price: 0.5, description: 'Frais de déplacement facturés au kilomètre (Ajuster la quantité).' },
  { id: 'prod_04', name: 'Accessoires Premium', price: 50, description: 'Collection d\'accessoires thématiques de qualité supérieure.' }
];

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  constructor() { }

  getProducts(): Observable<Product[]> {
    return of(MOCK_PRODUCTS);
  }
}
