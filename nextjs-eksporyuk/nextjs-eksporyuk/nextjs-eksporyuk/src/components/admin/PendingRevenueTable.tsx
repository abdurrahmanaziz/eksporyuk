import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Modal, Input, message } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { getSession } from 'next-auth/react';

interface PendingRevenue {
  id: string;
  status: string;
  type: string;
  amount: number;
  createdAt: string;
  wallet: {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  };
  transaction: {
    id: string;
    amount: number;
    type: string;
    status: string;
    createdAt: string;
    customerName: string;
    customerEmail: string;
    productId: string;
    product: {
      name: string;
    };
  };
}

const PendingRevenueTable: React.FC = () => {
  const [data, setData] = useState<PendingRevenue[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; id?: string }>({ open: false });
  const [note, setNote] = useState('');
  const [adjustedAmount, setAdjustedAmount] = useState<number | undefined>(undefined);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pending-revenue');
      const json = await res.json();
      setData(json.data || []);
    } catch (e) {
      message.error('Failed to fetch data');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pending-revenue/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', adjustedAmount, note }),
      });
      const json = await res.json();
      if (json.success) {
        message.success(json.message);
        fetchData();
      } else {
        message.error(json.error || 'Failed to approve');
      }
    } catch (e) {
      message.error('Failed to approve');
    }
    setLoading(false);
    setModal({ open: false });
    setNote('');
    setAdjustedAmount(undefined);
  };

  const handleReject = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pending-revenue/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', note }),
      });
      const json = await res.json();
      if (json.success) {
        message.success(json.message);
        fetchData();
      } else {
        message.error(json.error || 'Failed to reject');
      }
    } catch (e) {
      message.error('Failed to reject');
    }
    setLoading(false);
    setModal({ open: false });
    setNote('');
  };

  const columns: ColumnsType<PendingRevenue> = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'User', dataIndex: ['wallet', 'user', 'name'], key: 'user' },
    { title: 'Email', dataIndex: ['wallet', 'user', 'email'], key: 'email' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v) => `Rp ${v.toLocaleString('id-ID')}` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (v) => <Tag color={v === 'PENDING' ? 'orange' : v === 'APPROVED' ? 'green' : 'red'}>{v}</Tag> },
    { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', render: (v) => new Date(v).toLocaleString('id-ID') },
    { title: 'Action', key: 'action', render: (_, record) => (
      <>
        <Button icon={<CheckOutlined />} onClick={() => setModal({ open: true, id: record.id })} disabled={record.status !== 'PENDING'}>Approve</Button>
        <Button icon={<CloseOutlined />} danger onClick={() => setModal({ open: true, id: record.id })} disabled={record.status !== 'PENDING'} style={{ marginLeft: 8 }}>Reject</Button>
      </>
    ) },
  ];

  return (
    <>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} pagination={{ pageSize: 20 }} />
      <Modal
        open={modal.open}
        onCancel={() => setModal({ open: false })}
        onOk={() => modal.id && (note ? handleReject(modal.id) : handleApprove(modal.id))}
        title={note ? 'Reject Revenue' : 'Approve Revenue'}
        okText={note ? 'Reject' : 'Approve'}
        okButtonProps={{ danger: !!note }}
      >
        <Input.TextArea
          rows={3}
          placeholder={note ? 'Reason for rejection' : 'Optional note'}
          value={note}
          onChange={e => setNote(e.target.value)}
        />
        {!note && (
          <Input
            style={{ marginTop: 8 }}
            placeholder="Adjust amount (optional)"
            type="number"
            value={adjustedAmount}
            onChange={e => setAdjustedAmount(Number(e.target.value))}
          />
        )}
      </Modal>
    </>
  );
};

export default PendingRevenueTable;
