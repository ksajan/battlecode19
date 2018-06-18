import React, { Component } from 'react';
import Api from '../api';

class ScrimmageRequest extends Component {
    constructor() {
        super();
        this.state = {'open':true};
        this.accept = this.accept.bind(this);
        this.reject = this.reject.bind(this);
    }

    accept() {
        Api.acceptScrimmage(this.props.id, function() {
            this.setState({'open':false});
        }.bind(this));
    }

    reject() {
        Api.rejectScrimmage(this.props.id, function() {
            this.setState({'open':false});
        }.bind(this));
    }

    render() {
        if (this.state.open) return (
            <div className="alert alert-info" style={{ height:"3em" }}>
                <span style={{float:"left"}}>Scrimmage request from { this.props.team }.</span>
                <span style={{float:"right"}} className="pull-right"><button onClick={ this.accept } className="btn btn-success btn-xs">Accept</button> <button onClick={ this.reject } className="btn btn-danger btn-xs">Reject</button></span>
            </div>
        );
        else return (<div></div>);
    }
}

class ScrimmageRequests extends Component {
    constructor() {
        super();
        this.state = {'requests':[]};
    }

    componentDidMount() {
        Api.getScrimmageRequests(function(r) {
            this.setState({requests:r});
        }.bind(this));
    }

    render() {
        return (
            <div className="col-md-12">
                { this.state.requests.map(r => <ScrimmageRequest id={r.id} team={r.team} />) }
            </div>
        );
    }
}

class ScrimmageRequestor extends Component {
    constructor() {
        super();

        this.state = {up:"Request", input:""};
        this.changeHandler = this.changeHandler.bind(this);
        this.request = this.request.bind(this);
    }

    request() {
        this.setState({'up':'<i class="fa fa-circle-o-notch fa-spin"></i>'});
        Api.requestScrimmage(this.state.input, function(response) {
            if (response) this.setState({'up':'<i class="fa fa-check"></i>'});
            else this.setState({'up':'<i class="fa fa-times"></i>'});
            setTimeout(function() {
                this.setState({'up':'Request'});
            }.bind(this),2000);
        })
    }

    changeHandler(e) {
        this.setState({input: e.target.value});
    }

    render() {
        return (
            <div className="col-md-12">
                <div className="card">
                    <div className="content">
                        <div className="input-group">
                            <input type="text" className="form-control" onChange={ this.changeHandler } placeholder="Team to request..." />
                            <span className="input-group-btn">
                                <button className="btn btn-default" type="button" onclick={ this.request }dangerouslySetInnerHTML={{__html:this.state.up }}></button>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

class ScrimmageHistory extends Component {
    constructor() {
        super();
        this.state = {'scrimmages':[]};
    }

    componentDidMount() {
        Api.getScrimmageHistory(function(s) {
            this.setState({ scrimmages: s });
        }.bind(this));
    }

    render() {
        return (
            <div className="col-md-12">
                <div className="card">
                    <div className="header">
                        <h4 className="title">Scrimmage History</h4>
                    </div>
                    <div className="content table-responsive table-full-width">
                        <table className="table table-hover table-striped">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Status</th>
                                    <th>Team</th>
                                    <th>Color</th>
                                    <th>Replay</th>
                                </tr>
                            </thead>
                            <tbody>
                                { this.state.scrimmages.map(s => (
                                    <tr>
                                        <td>{ s.time }</td>
                                        <td>{ s.status }</td>
                                        <td>{ s.team }</td>
                                        <td>{ s.color }</td>
                                        <td><a href={ '/replay?' + s.replay }>Watch</a></td>
                                    </tr>
                                )) }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )
    }
}

class Scrimmaging extends Component {
    render() {
        return (
            <div className="content">
                <div className="content">
                    <div className="container-fluid">
                        <div className="row">
                            <ScrimmageRequests />
                            <ScrimmageRequestor />
                            <ScrimmageHistory />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Scrimmaging;