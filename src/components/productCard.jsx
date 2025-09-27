import { Card, CardContent } from "@/components/ui/card";
import {ShoppingBag} from "lucide-react";
import { Link } from 'react-router-dom';

export default function ProductCard(props) {
  return (
                <Card className="overflow-hidden rounded-3xl shadow-md group">
                  {/* Product Image */}
                  <div className="relative">
                    <Link to={`/product/${props.id}`}>
                      <img
                        src={props.image}
                        alt={props.name}
                        className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </Link>
                    <span className="absolute top-4 left-4 bg-white/90 text-xs font-medium text-[#C8B28D] px-1 py-2 rounded-full shadow">
                      50%
                    </span>
                  </div>

                  {/* Content */}
                  <CardContent className="bg-[#EADBC2] px-4 py-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-serif font-semibold text-white">
                          {props.name}
                        </p>
                        <p className="text-base font-medium text-white">
                          ${Number(props.price || 0).toFixed(2)}
                        </p>
                      </div>
                      <button className="h-10 rounded-[2px] bg-white text-[#C8B28D] rounded-full px-2">
                        <ShoppingBag className="h-6 w-6" />
                      </button>
                    </div>
                    
                    {/* Product sizes info */}
                    {props.sizes?.length > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-white/80">Sizes:</span>
                          <div className="flex gap-1">
                            {props.sizes.slice(0, 3).map((size, index) => {
                              // Handle both string and object sizes
                              const sizeValue = typeof size === 'string' ? size : (size.value || size.size || 'Unknown');
                              const sizeId = typeof size === 'object' && size.id ? String(size.id) : index;
                              return (
                                <span key={`${props.id}-size-${sizeId}-${index}`} className="text-xs bg-white/20 text-white px-1 py-0.5 rounded">
                                  {sizeValue}
                                </span>
                              );
                            })}
                            {props.sizes.length > 3 && (
                              <span className="text-xs text-white/60">+{props.sizes.length - 3}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
  );
}