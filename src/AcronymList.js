import React, { Component } from "react";
import { Button, Container, Form, Row, Col, DropdownButton, Dropdown } from 'react-bootstrap';
import BootstrapTable from 'react-bootstrap-table-next';
import cellEditFactory from 'react-bootstrap-table2-editor';
import paginationFactory from 'react-bootstrap-table2-paginator';

import InputBase from '@material-ui/core/InputBase';

var oldSearchId;
var languages = ["ENGLISH", "CHINESE","MALAY","TAMIL","KOREAN"];

class AcronymList extends Component {

    constructor(props) {
        super(props);
        this.state = {
            acronyms: [],
            searchTerm: '',
            selected: [],
            isSelected: false,
            changes: [],

            page: 1,
            pageSize: 10,
            totalRecords: 0,

            language: "ENGLISH"
        };
    }

    async componentDidMount() {
        const { searchTerm, page, pageSize } = this.state;
        const params = this.getRequestParams(searchTerm, page, pageSize);
        await this.retrieveAcronym(params);
    }

    async retrieveAcronym(params) {

        if (params.search) {
            if (languages.includes(params.search.toUpperCase())) {
                console.log("Found languages");
                const response = await fetch('/api/acronym/all/language/' + params.search.toUpperCase() +
                    '?offset=' + params.offset + '&limit=' + params.pageSize);
                const data = await response.json();
                const responseSize = await fetch('/api/acronym/all/language/' + params.search.toUpperCase() + '/count');
                const totalRecord = await responseSize.json();
                this.setState({ acronyms: data, totalRecords: totalRecord });
            } else {
                const response = await fetch('/api/acronym/all/' + params.search +
                    '?offset=' + params.offset + '&limit=' + params.pageSize);
                const data = await response.json();
                const responseSize = await fetch('/api/acronym/all/' + params.search + '/count');
                const totalRecord = await responseSize.json();
                console.log(totalRecord);
                this.setState({ acronyms: data, totalRecords: totalRecord });
            }
        } else {
            const response = await fetch('/api/acronym/all?offset=' + params.offset + '&limit=' + params.pageSize);
            const data = await response.json();
            console.log(data);
            const responseSize = await fetch('/api/acronym/all/count');
            const totalRecord = await responseSize.json();

            this.setState({ acronyms: data, totalRecords: totalRecord });
        }
    }

    async retrieveChanges(id) {
        const response = await fetch('api/acronym/changes/' + id);
        const data = await response.json();
        //console.log(data);
        this.setState({ changes: data });
    }

    getRequestParams(searchTerm, page, pageSize) {
        let params = {};
        let offset = 0;

        if (searchTerm) {
            params["search"] = searchTerm;
        }

        if (page) {
            params["page"] = page - 1;
            offset = (page - 1) * pageSize;
            console.log(offset);
            params["offset"] = offset;
        }

        if (pageSize) {
            params["pageSize"] = pageSize;
        }

        return params;
    }

    async remove(id) {

        const { searchTerm, page, pageSize, acronyms } = this.state;
        
        await fetch('/api/acronym/all/'+id, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        if (acronyms.length === 1 && page !== 0) {
            const params = this.getRequestParams(searchTerm, page-1, pageSize);
            await this.retrieveAcronym(params);
            this.setState({ page: page - 1 });
        } else {
            const params = this.getRequestParams(searchTerm, page, pageSize);
            await this.retrieveAcronym(params);
        }
    }

    async addNewAcronym() {
        const { searchTerm, page, pageSize, language } = this.state;
        console.log(language);

        const newAcronym = {
            acronym: this.acronymInput.value,
            full_term: this.full_termInput.value,
            remark: this.remarkInput.value,
            language: language
        };

        await fetch('api/acronym/new', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newAcronym),
        });
       
        const params = this.getRequestParams(searchTerm, page, pageSize);
        await this.retrieveAcronym(params);
    }

    async findAcronym(filterVal) {
        const response = await fetch('/api/acronym/all/' + filterVal +
            '?offset=' + 0 + '&limit=' + this.state.sizePerPage);
        const body = await response.json();
        console.log(body);
        const responseSize = await fetch('/api/acronym/all/' + filterVal + '/count');
        const sizeResult = await responseSize.json();
        this.setState({ acronyms: body, totalSize: sizeResult, page: 1 });
               
    }

    buttonDelete = (cell, row, rowIndex, formatExtraData) => {
        return (
            <Button size="sm" variant="danger" onClick={() => this.remove(row.id)}>Delete</Button>
            )
    }  

    showHistory = () => {
        const { changes } = this.state;
        const data = changes
        const columns = [{
            dataField: 'id',
            text: 'id',
            hidden: true
        }, {
                dataField: 'timestamp',
                text: 'Timestamp',

            }, {
                dataField: 'changes',
                text: 'Changes'

            }];

        return (
            <div>
                <Container fluid>
                    <BootstrapTable
                        remote
                        keyField="id"
                        data={data}
                        columns={columns}
                    />

                </Container>
            </div>
            )
    }

    showAddAcronym = () => {
        
        const handleSelect = (e) => {
            console.log(e);
            this.setState({ language: e });
        };

        let populateDropdown = languages.map(function (item, i) {
            
            return (
                <Dropdown.Item eventKey={item} key={i}>{item}</Dropdown.Item>
            )
        });
        
        
        return (
            <div className="AddAcronymForm">
                <h3 className="formTitle">Add New Acronym </h3>
                
                <Form>
                    <Row className="RowMargin">
                        <Col>
                            <Form.Label>Acronym</Form.Label>
                            <Form.Control placeholder="Acronym" ref={input => this.acronymInput = input}/>
                        </Col>
                        <Col>
                            <Form.Label>Full Term</Form.Label>
                            <Form.Control placeholder="Full Term" ref={input => this.full_termInput = input} />
                        </Col>
                    </Row>
                    <Row className="RowMargin">
                        
                        <Col>
                            <Form.Label>Remarks/Comments</Form.Label>
                            <Form.Control as="textarea" placeholder="Remark" ref={input => this.remarkInput = input}/>
                        </Col>
                    </Row>
                    <Row className="RowMargin">
                        <Col>
                            <DropdownButton title={this.state.language} onSelect={handleSelect}>
                                {populateDropdown}
                            </DropdownButton> 
                        </Col>
                        <Col>
                            <Button variant="success" className="right" onClick={() => {
                                this.setState({ isAdding: false, language:"ENGLISH" });
                                console.log(this.remarkInput.value);
                                this.addNewAcronym()
                                this.remarkInput.value = "";
                                this.acronymInput.value = "";
                                this.full_termInput.value = "";
                            }}>Submit</Button>
                        </Col>
                         
                        
                    </Row>
  
                </Form>
               
            </div>
        );
    }

    handleTableChange = (type, { page, sizePerPage }) => {
        const { searchTerm } = this.state;
        const pageSize = sizePerPage;
        console.log("Type : " + type);
        console.log("page : " + page);
        console.log("pageSize : " + pageSize);


        if (type === 'pagination') {
            const params = this.getRequestParams(searchTerm, page, pageSize);
            console.log(params);
            this.retrieveAcronym(params);
            this.setState({ page: page, pageSize: sizePerPage });

        }
        
    }

    onSearchTerm(e) {
        var tempSearchTerm = e.target.value;
        if (oldSearchId !== null) {
            clearTimeout(oldSearchId);
        }

        const onSearchTerm = setTimeout(() => {
            console.log(tempSearchTerm);
            this.setState({ searchTerm: tempSearchTerm, page: 1 });

            const { searchTerm, page, pageSize } = this.state;
            const formattedParams = this.getRequestParams(searchTerm, page, pageSize);
            this.retrieveAcronym(formattedParams);
        }, 1000);

        oldSearchId = onSearchTerm;

    }

    onSelectRow = (row, isSelect, rowIndex, e) => {

        if (isSelect) {
            this.retrieveChanges(row.id);
            //console.log(row);
            this.setState(() => ({
                selected: [row.id],
                isSelected: true
            }));
        } else {
            this.setState(() => ({
                selected: [],
                isSelected: false
            }));
        }

    }

    render() {

        const { pageSize, page, totalRecords, acronyms, selected } = this.state;



        const data = acronyms;
        const columns = [{
            dataField: 'id',
            text: 'acronym id',
            hidden: true
        }, {
                dataField: 'acronym',
                text: 'Acronym',
                headerStyle: () => {
                    return { width: "10%" };
                }
        }, {
                dataField: 'full_term',
                text: 'Full Term',
                headerStyle: () => {
                    return { width: "40%" };
                }
        }, {
                dataField: 'remark',
                text: 'Remarks',
                headerStyle: () => {
                    return { width: "35%" };
                }
        }, {
                dataField: 'language',
                text: 'Language',
                editable: false,
                headerStyle: () => {
                    return { width: "8%" };
                }
        }, {

                dataField: 'actions',
                text: 'Actions',
                formatter: this.buttonDelete,
                headerStyle: () => {
                    return { width: "5.5%" };
                }
            }];

        const selectRow = {
            mode: 'checkbox',
            hideSelectColumn: true,
            clickToSelect: true,
            clickToEdit: true,
            bgColor: '#8CB0F9',
            selected: selected,
            onSelect: this.onSelectRow,
        };

        const DataTable = ({ data, page, sizePerPage, onTableChange, totalSize }) => (
            <div>
                <Container fluid>

                    <BootstrapTable
                        remote
                        striped
                        keyField="id"
                        data={data}
                        columns={columns}
                        pagination={paginationFactory({ page, sizePerPage, totalSize })}
                        cellEdit={cellEdit}
                        onTableChange={onTableChange}
                        selectRow={ selectRow }
                    />
                    
                </Container>
            </div>
        )

        const cellEdit = cellEditFactory({
            mode: 'dbclick',
            beforeSaveCell: (oldValue, newValue, row, column) => {
                console.log("Old Value : " + oldValue);
                console.log("New Value : " + newValue);
                //console.log("row/elemnt ID : " + row.id);
                //console.log("column : " + column.dataField);
                var changes = column.dataField + " was changed: " + oldValue + " => " + newValue;
                var date = new Date();
                var timestamp = date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear() + "\t" +
                    date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
                var changeRecord = {
                    id: row.id,
                    changes: changes,
                    timestamp: timestamp,
                }

                var updatedAcronym = {
                    acronym: row.acronym || '',
                    full_term: row.full_term || '',
                    remark: row.remark || '',
                    id: row.id,
                    language: row.language
                }
                switch (column.dataField) {
                    case 'acronym':
                        updatedAcronym = {
                            acronym: newValue,
                            full_term: row.full_term || '',
                            remark: row.remark || '',
                            id: row.id,
                            language: row.language
                        };
                        break;
                    case 'full_term':
                        updatedAcronym = {    
                            acronym: row.acronym || '',
                            full_term: newValue,
                            remark: row.remark || '',
                            id: row.id,
                            language: row.language
                        };
                        break;
                    case 'remark':
                        updatedAcronym = {
                            acronym: row.acronym || '',
                            full_term: row.full_term || '',
                            remark: newValue,
                            id: row.id,
                            language: row.language
                        };
                        break;
                }

                console.log(updatedAcronym);
                
                fetch('api/acronym/all/' + row.id, {
                    method: 'PUT',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedAcronym),
                });

                fetch('api/acronym/changes/new', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(changeRecord),
                });

                let updatedAcronymIndex = [...this.state.acronyms].findIndex(i => i.id == row.id);
                let updatedData = this.state.acronyms;
                updatedData[updatedAcronymIndex] = updatedAcronym;
                console.log(updatedData);
                this.setState({ acronyms: updatedData });
                this.retrieveChanges(row.id);

            }
        });

        return (
            <div>
                <h2 className="title">Acronym List</h2>
                <div>
                    {this.showAddAcronym()}
                </div>

                <div className="searchBar">
                    <InputBase
                        type="text"
                        fullWidth={true}
                        placeholder="Search by Acronym"
                        onChange={this.onSearchTerm.bind(this)}
                        inputProps={{
                            style: {
                                height: '35px',
                            },
                        }}
                    />
                </div>
                
                <DataTable
                    data={data}
                    page={page}
                    sizePerPage={pageSize}
                    totalSize={totalRecords}
                    onTableChange={this.handleTableChange}
                />

                <div>
                    {this.state.isSelected ? this.showHistory() : null}
                </div>
            </div>
            
        )

    }

}

export default AcronymList;




/*
     <BootstrapTable
                        remote
                        striped
                        keyField="id"
                        data={data}
                        columns={columns}
                        pagination={paginationFactory({ page, sizePerPage, totalSize })}
                        cellEdit={ cellEdit }
                        onTableChange={onTableChange}
                    />
*/