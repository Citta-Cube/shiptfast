import React, { useState, useEffect, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from 'lucide-react';

const PalletInput = ({ pallet, index, updatePallet, removePallet }) => {
  const calculateChargeableWeight = (length, width, height, grossWeight) => {
    const volumetricWeight = (length * width * height) / 6000; // 6000 cm³/kg for air freight
    return Math.max(volumetricWeight, grossWeight);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedPallet = { ...pallet, [name]: parseFloat(value) || 0 };
    
    if (['length', 'width', 'height', 'grossWeight'].includes(name)) {
      updatedPallet.chargeableWeight = calculateChargeableWeight(
        updatedPallet.length,
        updatedPallet.width,
        updatedPallet.height,
        updatedPallet.grossWeight
      );
    }
    
    updatePallet(index, updatedPallet);
  };

  return (
    <div className="grid grid-cols-6 gap-4 items-center mb-4 p-4 rounded-lg">
      <Input
        type="number"
        name="length"
        value={pallet.length || ''}
        onChange={handleChange}
        placeholder="Length (cm)"
      />
      <Input
        type="number"
        name="width"
        value={pallet.width || ''}
        onChange={handleChange}
        placeholder="Width (cm)"
      />
      <Input
        type="number"
        name="height"
        value={pallet.height || ''}
        onChange={handleChange}
        placeholder="Height (cm)"
      />
      <Input
        type="number"
        name="grossWeight"
        value={pallet.grossWeight || ''}
        onChange={handleChange}
        placeholder="Gross Weight (kg)"
      />
      <div className="col-span-2 flex items-center">
        <span className="mr-2">Chargeable Weight:</span>
        <span className="font-bold">{pallet.chargeableWeight?.toFixed(2) || 0} kg</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="ml-auto"
          onClick={() => removePallet(index)}
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const PalletizedCargoDetails = ({ onChange }) => {
    const [pallets, setPallets] = useState([{ id: Date.now() }]);
    const [totalGrossWeight, setTotalGrossWeight] = useState(0);
    const [totalChargeableWeight, setTotalChargeableWeight] = useState(0);
  
    const calculateTotals = useCallback(() => {
      const grossWeight = pallets.reduce((sum, pallet) => sum + (pallet.grossWeight || 0), 0);
      const chargeableWeight = pallets.reduce((sum, pallet) => sum + (pallet.chargeableWeight || 0), 0);
      
      setTotalGrossWeight(grossWeight);
      setTotalChargeableWeight(chargeableWeight);
  
      return { grossWeight, chargeableWeight };
    }, [pallets]);
  
    useEffect(() => {
      const { grossWeight, chargeableWeight } = calculateTotals();
      onChange({
        pallets,
        totalGrossWeight: grossWeight,
        totalChargeableWeight: chargeableWeight
      });
    }, [pallets, calculateTotals, onChange]);
  
    const addPallet = () => {
      setPallets(prevPallets => [...prevPallets, { id: Date.now() }]);
    };
  
    const updatePallet = (index, updatedPallet) => {
      setPallets(prevPallets => {
        const newPallets = [...prevPallets];
        newPallets[index] = updatedPallet;
        return newPallets;
      });
    };
  
    const removePallet = (index) => {
      setPallets(prevPallets => prevPallets.filter((_, i) => i !== index));
    };
  
    return (
      <div className="space-y-4">
        <h4 className="text-lg font-semibold">Palletized Cargo Details</h4>
        {pallets.map((pallet, index) => (
          <PalletInput
            key={pallet.id}
            pallet={pallet}
            index={index}
            updatePallet={updatePallet}
            removePallet={removePallet}
          />
        ))}
        <Button type="button" onClick={addPallet} className="w-full">
          <Plus className="mr-2 h-4 w-4" /> Add Pallet
        </Button>
        <div className="flex justify-between text-lg font-semibold">
          <span>Total Gross Weight: {totalGrossWeight.toFixed(2)} kg</span>
          <span>Total Chargeable Weight: {totalChargeableWeight.toFixed(2)} kg</span>
        </div>
      </div>
    );
  };
  
  export default PalletizedCargoDetails;