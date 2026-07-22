import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { TextInput } from '../../components/ui/TextInput/TextInput';
import { SelectInput } from '../../components/ui/SelectInput/SelectInput';
import { Card } from '../../components/ui/Card/Card';
import styles from './QuotationFormContent.module.css';

import { useQuotations } from '../../hooks/useQuotations';
import { useClients } from '../../hooks/useClients';
import { useProducts } from '../../hooks/useInventory';
import { useWarehouses } from '../../hooks/useWarehouses';

interface QuotationFormProps {
  mode: 'create' | 'edit';
}

interface QuotationFormData {
  clientId: string;
  notes?: string;
  lineItems: {
    productId: string;
    warehouseId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export const QuotationFormContent: React.FC<QuotationFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { tenantSlug, id } = useParams();
  
  const { createQuotation, updateQuotation, fetchQuotationDetail, loading: isSaving } = useQuotations();
  const { clients, fetchClients } = useClients();
  const { products, fetchProducts } = useProducts();
  const { warehouses, fetchWarehouses } = useWarehouses();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { control, handleSubmit, watch, reset, formState: { errors } } = useForm<QuotationFormData>({
    defaultValues: {
      clientId: '',
      notes: '',
      lineItems: [{ productId: '', warehouseId: '', quantity: 1, unitPrice: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineItems'
  });

  const watchLineItems = watch('lineItems');
  
  const subtotal = watchLineItems.reduce((sum, item) => {
    return sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  }, 0);

  useEffect(() => {
    fetchClients();
    fetchProducts();
    fetchWarehouses();
  }, [fetchClients, fetchProducts, fetchWarehouses]);

  useEffect(() => {
    if (mode === 'edit' && id) {
      fetchQuotationDetail(id).then((data) => {
        if (data && data.quotation) {
          reset({
            clientId: data.quotation.clientId,
            notes: data.quotation.notes || '',
            lineItems: data.lineItems.map((li: any) => ({
              productId: li.productId,
              warehouseId: li.warehouseId,
              quantity: li.quantity,
              unitPrice: li.unitPrice
            }))
          });
        }
      });
    }
  }, [mode, id, fetchQuotationDetail, reset]);

  const onSubmit = async (data: QuotationFormData) => {
    try {
      if (mode === 'create') {
        const result = await createQuotation(data);
        navigate(`/${tenantSlug}/quotations/${result.id}`);
      } else if (id) {
        await updateQuotation(id, data);
        navigate(`/${tenantSlug}/quotations/${id}`);
      }
    } catch (error: any) {
      setSubmitError(error.message || 'An error occurred while saving the quotation.');
    }
  };

  const clientOptions = clients.map(c => ({ value: c.id, label: c.name }));
  const productOptions = products.map(p => ({ value: p.id, label: `${p.sku} - ${p.name}` }));
  const warehouseOptions = warehouses.map(w => ({ value: w.id, label: w.name }));

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.header}>
          <div>
            <div className={styles.breadcrumb}>CRM &gt; Quotations &gt; {mode === 'create' ? 'New' : 'Edit'}</div>
            <h1 className={styles.title}>{mode === 'create' ? 'Create Quotation' : 'Edit Quotation'}</h1>
          </div>
          <div className={styles.headerActions}>
            <Button variant="outline" type="button" onClick={() => navigate(-1)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isSaving}>Save Quotation</Button>
          </div>
        </div>

        {submitError && (
          <div style={{ padding: '12px 16px', background: 'var(--color-error-container, #fdecea)', color: 'var(--color-on-error-container, #b71c1c)', borderRadius: '8px', marginBottom: '16px', marginTop: '16px' }}>
            {submitError}
          </div>
        )}

        <div className="mt-lg">
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>1. Client Details</h2>
            </div>
            <Card padding="lg">
              <div className={styles.formGrid}>
                <Controller
                  name="clientId"
                  control={control}
                  rules={{ required: 'Client is required' }}
                  render={({ field }) => (
                      <SelectInput
                        label="Client *"
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.clientId?.message}
                      >
                        <option value="">Select a client</option>
                        {clientOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </SelectInput>
                  )}
                />
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <TextInput
                      label="Notes"
                      placeholder="Optional notes..."
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </Card>
          </div>

          <div className={`${styles.section} mt-xl`}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>2. Line Items</h2>
              <Button type="button" variant="outline" icon={<Plus size={16} />} onClick={() => append({ productId: '', warehouseId: '', quantity: 1, unitPrice: 0 })}>
                Add Row
              </Button>
            </div>
            
            <div className={styles.lineItemsContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: '35%' }}>Product</th>
                    <th style={{ width: '25%' }}>Warehouse</th>
                    <th style={{ width: '12%' }}>Quantity</th>
                    <th style={{ width: '15%' }}>Unit Price</th>
                    <th style={{ width: '10%', textAlign: 'right' }}>Line Total</th>
                    <th className={styles.tdAction}></th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => {
                    const quantity = watchLineItems[index]?.quantity || 0;
                    const unitPrice = watchLineItems[index]?.unitPrice || 0;
                    const lineTotal = quantity * unitPrice;
                    
                    return (
                      <tr key={field.id}>
                        <td>
                          <Controller
                            name={`lineItems.${index}.productId`}
                            control={control}
                            rules={{ required: 'Required' }}
                            render={({ field: { onChange, value } }) => (
                              <SelectInput
                                value={value}
                                onChange={(e) => {
                                  onChange(e);
                                  // Auto-fill price
                                  const prod = products.find(p => p.id === e.target.value);
                                  if (prod) {
                                    const currentItems = watch('lineItems');
                                    currentItems[index].unitPrice = prod.price || 0;
                                    reset({ ...watch(), lineItems: currentItems });
                                  }
                                }}
                                error={errors.lineItems?.[index]?.productId?.message}
                              >
                                <option value="">Select Product</option>
                                {productOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                              </SelectInput>
                            )}
                          />
                        </td>
                        <td>
                          <Controller
                            name={`lineItems.${index}.warehouseId`}
                            control={control}
                            rules={{ required: 'Required' }}
                            render={({ field: { onChange, value } }) => (
                              <SelectInput
                                value={value}
                                onChange={onChange}
                                error={errors.lineItems?.[index]?.warehouseId?.message}
                              >
                                <option value="">Select Warehouse</option>
                                {warehouseOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                              </SelectInput>
                            )}
                          />
                        </td>
                        <td>
                          <Controller
                            name={`lineItems.${index}.quantity`}
                            control={control}
                            rules={{ 
                              required: 'Required',
                              min: { value: 1, message: '> 0' }
                            }}
                            render={({ field: { onChange, value } }) => (
                              <TextInput
                                type="number"
                                min="1"
                                value={value}
                                onChange={onChange}
                                error={errors.lineItems?.[index]?.quantity?.message}
                              />
                            )}
                          />
                        </td>
                        <td>
                          <Controller
                            name={`lineItems.${index}.unitPrice`}
                            control={control}
                            rules={{ 
                              required: 'Required',
                              min: { value: 0, message: '>= 0' }
                            }}
                            render={({ field: { onChange, value } }) => (
                              <TextInput
                                type="number"
                                min="0"
                                step="0.01"
                                value={value}
                                onChange={onChange}
                                error={errors.lineItems?.[index]?.unitPrice?.message}
                              />
                            )}
                          />
                        </td>
                        <td style={{ textAlign: 'right', verticalAlign: 'middle', fontWeight: 600 }}>
                          ${lineTotal.toFixed(2)}
                        </td>
                        <td className={styles.tdAction}>
                          {fields.length > 1 && (
                            <button type="button" className={styles.actionButton} onClick={() => remove(index)}>
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={styles.totalsSection}>
              <div className={styles.totalsCard}>
                <div className={styles.totalRow}>
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className={styles.grandTotalRow}>
                  <span>Grand Total</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
};
