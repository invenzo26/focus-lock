import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, Plus, ArrowDownLeft, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function WalletPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('id', user.id)
      .single();
    setBalance(profile?.wallet_balance || 0);

    const { data: paymentData } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setPayments(paymentData || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleAddFunds = async (amount: number) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ wallet_balance: balance + amount })
      .eq('id', user.id);

    if (error) { toast.error('Failed to add funds'); return; }

    await supabase.from('payments').insert({
      user_id: user.id,
      amount,
      type: 'recharge',
      status: 'completed',
    });

    fetchData();
    toast.success(`+${amount} coins added!`);
  };

  const getPaymentIcon = (type: string) => {
    if (type === 'recharge') return <ArrowDownLeft className="w-4 h-4 text-primary" />;
    if (type === 'reward') return <Coins className="w-4 h-4 text-primary" />;
    return <AlertTriangle className="w-4 h-4 text-destructive" />;
  };

  const getPaymentColor = (type: string) => type === 'penalty' ? 'text-destructive' : 'text-primary';

  return (
    <div className="pb-4">
      <h1 className="text-2xl font-bold text-foreground mb-5">Wallet</h1>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 neon-border text-center mb-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Coins className="w-8 h-8 text-primary" />
            <span className="text-5xl font-bold font-mono text-foreground">{balance}</span>
          </div>
          <p className="text-sm text-muted-foreground">Total Coins</p>
          <button
            onClick={() => handleAddFunds(50)}
            className="mt-4 gradient-primary text-primary-foreground font-semibold text-sm px-5 py-2.5 rounded-xl glow-primary flex items-center gap-1.5 mx-auto active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </motion.div>

      {/* Quick Add */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {[50, 100, 200, 500].map(amt => (
          <button
            key={amt}
            onClick={() => handleAddFunds(amt)}
            className="glass rounded-xl py-3 text-center font-mono font-bold text-foreground active:scale-95 transition-transform"
          >
            +{amt}
          </button>
        ))}
      </div>

      {/* Transactions */}
      <h3 className="text-sm font-semibold text-foreground mb-3">Transactions</h3>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : payments.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 text-sm">No transactions yet</p>
      ) : (
        <div className="space-y-2">
          {payments.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass rounded-xl p-3.5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  p.type === 'penalty' ? 'bg-destructive/15' : 'bg-primary/15'
                }`}>
                  {getPaymentIcon(p.type)}
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground capitalize">
                    {p.type === 'reward' ? 'Focus Session' : p.type === 'penalty' ? 'Early Exit Penalty' : 'Recharge'}
                  </span>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {', '}
                    {new Date(p.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <span className={`text-sm font-bold font-mono ${getPaymentColor(p.type)}`}>
                {p.type === 'penalty' ? '-' : '+'}{p.amount}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
