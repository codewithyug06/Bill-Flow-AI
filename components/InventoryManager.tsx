
import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { Search, Plus, Edit2, Trash2, ScanBarcode } from 'lucide-react';
import { BarcodeScanner } from './BarcodeScanner';

interface InventoryManagerProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ products, setProducts }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '', category: '', price: 0, stock: 0, unit: 'pcs', description: '', barcode: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Close modal on Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setShowScanner(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.barcode && p.barcode.includes(searchTerm))
  );

  const handleSaveProduct = () => {
    if (newProduct.name && newProduct.price) {
      if (newProduct.id) {
          // Edit Mode
          setProducts(products.map(p => p.id === newProduct.id ? { ...p, ...newProduct } as Product : p));
      } else {
          // Add Mode
          setProducts([...products, { 
            id: Date.now().toString(),
            name: newProduct.name!,
            category: newProduct.category || 'General',
            price: Number(newProduct.price),
            stock: Number(newProduct.stock) || 0,
            unit: newProduct.unit || 'pcs',
            description: newProduct.description,
            barcode: newProduct.barcode
          }]);
      }
      setIsModalOpen(false);
      setNewProduct({ name: '', category: '', price: 0, stock: 0, unit: 'pcs', description: '', barcode: '' });
    }
  };

  const handleEditClick = (product: Product) => {
    setNewProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
      if (confirm('Delete this product?')) {
          setProducts(products.filter(p => p.id !== id));
      }
  };

  const handleScan = (code: string) => {
      setNewProduct(prev => ({ ...prev, barcode: code }));
      setShowScanner(false);
  };

  return (
    <div className="space-y-6">
      {showScanner && <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
        <button 
          onClick={() => {
            setNewProduct({ name: '', category: '', price: 0, stock: 0, unit: 'pcs', description: '', barcode: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by name or barcode..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none">
              <option>All Categories</option>
              <option>Electronics</option>
              <option>Furniture</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Barcode</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-indigo-50/60 transition-colors duration-200 group">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 group-hover:text-indigo-700 transition-colors">{product.name}</div>
                    <div className="text-xs text-gray-400 truncate max-w-[200px]">{product.description}</div>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-500">
                    {product.barcode || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600"><span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium border border-indigo-100">{product.category}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className={`flex items-center gap-2 ${product.stock < 10 ? 'text-red-500 font-medium' : ''}`}>
                      {product.stock} {product.unit}
                      {product.stock < 10 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">${product.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditClick(product)} className="p-1.5 hover:bg-white rounded-md text-gray-500 shadow-sm border border-transparent hover:border-gray-200"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteClick(product.id)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-md text-gray-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">{newProduct.id ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                 <label className="text-sm font-medium text-gray-700">Barcode / SKU</label>
                 <div className="flex gap-2">
                    <input 
                      type="text" 
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono text-sm"
                      value={newProduct.barcode || ''}
                      onChange={e => setNewProduct({...newProduct, barcode: e.target.value})}
                      placeholder="Scan or type..."
                    />
                    <button 
                      onClick={() => setShowScanner(true)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-200"
                      title="Scan Barcode"
                    >
                      <ScanBarcode className="w-4 h-4" />
                    </button>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Product Name</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    value={newProduct.name}
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                    placeholder="e.g. Running Shoes"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    value={newProduct.category}
                    onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                    placeholder="e.g. Apparel"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Price ($)</label>
                  <input 
                    type="number" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    value={newProduct.price}
                    onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Stock</label>
                  <input 
                    type="number" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    value={newProduct.stock}
                    onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Unit</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    value={newProduct.unit}
                    onChange={e => setNewProduct({...newProduct, unit: e.target.value})}
                  >
                    <option value="pcs">Pieces</option>
                    <option value="kg">Kg</option>
                    <option value="box">Box</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-700">Description</label>
                </div>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                  value={newProduct.description}
                  onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                  placeholder="Enter product description..."
                ></textarea>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveProduct}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
              >
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
    