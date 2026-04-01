import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, ShoppingBag, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { toast } from 'sonner';

interface StoreItem {
  id: string;
  name: string;
  description: string;
  price_coins: number;
  category: string;
  icon: string;
}

export default function StorePage() {
  const { user } = useAuth();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [purchased, setPurchased] = useState<string[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [{ data: itemsData }, { data: purchasesData }, { data: profile }] = await Promise.all([
        supabase.from('store_items').select('*').order('price_coins'),
        supabase.from('user_purchases').select('item_id').eq('user_id', user.id),
        supabase.from('profiles').select('wallet_balance').eq('id', user.id).single(),
      ]);
      setItems((itemsData as StoreItem[]) || []);
      setPurchased((purchasesData || []).map((p: any) => p.item_id));
      setBalance(profile?.wallet_balance || 0);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handlePurchase = async (item: StoreItem) => {
    if (!user) return;
    if (purchased.includes(item.id)) { toast.info('Already purchased!'); return; }
    if (balance < item.price_coins) { toast.error('Not enough coins!'); return; }

    await supabase.from('profiles').update({ wallet_balance: balance - item.price_coins }).eq('id', user.id);
    await supabase.from('user_purchases').insert({ user_id: user.id, item_id: item.id });
    await supabase.from('payments').insert({ user_id: user.id, amount: item.price_coins, type: 'penalty', status: 'completed' });

    setBalance(b => b - item.price_coins);
    setPurchased(p => [...p, item.id]);
    toast.success(`Purchased ${item.name}! 🎉`);
  };

  const categories = ['all', ...new Set(items.map(i => i.category))];
  const filtered = filter === 'all' ? items : items.filter(i => i.category === filter);

  return (
    <AppLayout>
      <div className="pb-4">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold text-foreground">Store</h1>
          <div className="glass rounded-xl px-3 py-1.5 flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold font-mono text-foreground">{balance}</span>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 no-scrollbar">
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                filter === cat ? 'gradient-primary text-primary-foreground' : 'glass text-muted-foreground'
              }`}>{cat}</button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((item, i) => {
              const owned = purchased.includes(item.id);
              return (
                <motion.div key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className={`glass rounded-xl p-4 flex flex-col items-center text-center ${owned ? 'border border-primary/30' : ''}`}>
                  <span className="text-3xl mb-2">{item.icon}</span>
                  <h3 className="text-sm font-bold text-foreground mb-1">{item.name}</h3>
                  <p className="text-[10px] text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
                  {owned ? (
                    <div className="flex items-center gap-1 text-xs text-primary font-semibold">
                      <Check className="w-3.5 h-3.5" /> Owned
                    </div>
                  ) : (
                    <button onClick={() => handlePurchase(item)}
                      className="gradient-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 active:scale-95 transition-transform">
                      <Coins className="w-3.5 h-3.5" /> {item.price_coins}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
