import React, { useMemo, useLayoutEffect, forwardRef, useState } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import MaterialTable from "material-table";
import ArrowDownward from '@material-ui/icons/ArrowDownward';
// import FirstPage from '@material-ui/icons/FirstPage';
// import LastPage from '@material-ui/icons/LastPage';
// import ChevronLeft from '@material-ui/icons/ChevronLeft';
// import ChevronRight from '@material-ui/icons/ChevronRight';
import Clear from '@material-ui/icons/Clear';
import Search from '@material-ui/icons/Search';
import { getReadList } from '@/lib/note';

const tableIcons = {
    SortArrow: forwardRef((props, ref) => <ArrowDownward {...props} ref={ref} />),
    Search: forwardRef((props, ref) => <Search {...props} ref={ref} />),
    Clear: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
    ResetSearch: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
    // FirstPage: forwardRef((props, ref) => <FirstPage {...props} ref={ref} />),
    // LastPage: forwardRef((props, ref) => <LastPage {...props} ref={ref} />),
    // NextPage: forwardRef((props, ref) => <ChevronRight {...props} ref={ref} />),
    // PreviousPage: forwardRef((props, ref) => <ChevronLeft {...props} ref={ref} />),
};


export default function ReadListTable({ noteId, onError }) {
    const [readList, setReadList] = useState(null);

    const tableData = useMemo(() => {
        console.log(`ReadList(${noteId})    `, readList);
        const columns = [
            { title: covi.getDic('Dept', '부서'), field: 'dept' },
            { title: covi.getDic('Name', '이름'), field: 'name' },
            {
                title: covi.getDic('Read', '읽음'), field: 'readFlag', render: (rowData) => {
                    const txtColor = rowData.readFlag === 'Y' ? '#1976d2' : '#F86A60';
                    const txt = rowData.readFlag === 'Y' ? covi.getDic('Check', '확인') : covi.getDic('Uncheck', '미확인');
                    return <span style={{ color: txtColor }}>{txt}</span>
                }
            },
        ];
        const data = readList && readList.map((status) => {
            return {
                dept: status.deptName,
                name: `${status.displayName || 'UNKNOWN'} ${status.jobLevelName || ''}`,
                readFlag: status.readFlag
            };
        });

        const total = readList?.length;
        const read = readList?.reduce((acc, cur) => {
            return cur?.readFlag === 'Y' ? acc+1 : acc;
        }, 0);

        return {
            columns,
            data,
            total,
            read,
            unread: total - read
        }
    }, [readList]);

    async function fetchReadList() {
        try {
            const { data } = await getReadList({ noteId });
            if (data.status === 'SUCCESS') {
                setReadList(data.result);
            } else {
                throw new Error(data);
            }
        } catch (err) {
            onError(err);
        }
    }

    useLayoutEffect(() => {
        fetchReadList();
    }, []);

    if (readList === null) {
        return <></>;
    } else {
        return (
            <Scrollbars autoHide={true} >
                <MaterialTable
                    title={`Total: ${tableData.total} | ${covi.getDic('Check')}: ${tableData.read} | ${covi.getDic('Uncheck')}: ${tableData.unread}`}
                    columns={tableData.columns}
                    data={tableData.data}
                    options={{
                        paging: false
                    }}
                    style={{
                        marginLeft: '10px',
                        marginRight: '10px',
                        marginBottom: '70px',
                        marginTop: '10px',
                        userSelect: 'text'
                    }}
                    icons={tableIcons}
                />
            </Scrollbars>
        );
    }
}
