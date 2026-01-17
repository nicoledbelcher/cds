import { Text } from '@coinbase/cds-web/typography/Text';

type Column = {
  key: string;
  label: string;
  width: string;
};

type StylesTableProps = {
  columns: Column[];
  data: Record<string, string>[];
};

const tableStyle = { marginBottom: 0 };
const theadStyle = { backgroundColor: 'transparent' };

function StylesTable({ columns, data }: StylesTableProps) {
  return (
    <table style={tableStyle}>
      <thead style={theadStyle}>
        <tr>
          {columns.map((col) => (
            <th key={col.key} style={{ width: col.width }}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <tr key={index}>
            {columns.map((col) => (
              <td key={col.key}>
                <Text mono={col.key !== 'description' && col.key !== 'condition'} font="body">
                  {row[col.key]}
                </Text>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default StylesTable;
