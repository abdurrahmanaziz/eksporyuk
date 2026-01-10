import React, { useEffect, useState } from 'react';
import { Table, Tag, message } from 'antd';
import { ColumnsType } from 'antd/es/table';

interface Report {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  details: string;
}

const ReportsTable: React.FC = () => {
  const [data, setData] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports');
      const json = await res.json();
      setData(json.data || []);
    } catch (e) {
      message.error('Failed to fetch reports');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns: ColumnsType<Report> = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'User', dataIndex: ['user', 'name'], key: 'user' },
    { title: 'Email', dataIndex: ['user', 'email'], key: 'email' },
    { title: 'Type', dataIndex: 'type', key: 'type' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (v) => <Tag color={v === 'OPEN' ? 'orange' : v === 'CLOSED' ? 'green' : 'red'}>{v}</Tag> },
    { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', render: (v) => new Date(v).toLocaleString('id-ID') },
    { title: 'Details', dataIndex: 'details', key: 'details' },
  ];

  return <Table rowKey="id" columns={columns} dataSource={data} loading={loading} pagination={{ pageSize: 20 }} />;
};

export default ReportsTable;
