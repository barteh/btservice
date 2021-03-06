/*
 * File: AsService.ts
 * Project: @barteh/as-service
 * File Created: Thursday, 13th June 2019 7:27:52 am
 * Author: rafat (ahadrt@gmail.com)
 * -----
 * Last Modified: Wednesday, 16th October 2019 1:46:46 am
 * Modified By: rafat (ahadrt@gmail.com>)
 * -----
 * Copyright 2018 - 2021 Borna Mehr Fann, Borna Mehr Fann
 * Trademark barteh
 */
import {AObservable, ASubscriber} from "../AObservable";
import {btoa, allPossible} from "../utils";

declare type TPrimitive = Array < any > | boolean | string | number | object;
declare type TLoader = (...args : any[]) => any;
declare type TData = TPrimitive | AsService | Promise < any > | TLoader;

declare type TMapper = (data : any, ...extraParams : any[]) => any;

export default class AsService {
		private _loader : TLoader;
		private _mapper?: TMapper;
		private _source?: AsService;
		private _observables : {
				[id : string]: AObservable;
		};
		private _defaultObservable : AObservable;

		private _paramCount : number = 0;
		private _data : TData;
		constructor(data : TData, mapper?: TMapper, source?: AsService) {
				this._data = data;
				this._mapper = mapper;
				let initialValue = undefined;
				this._source = source;

				if (typeof data === "function") {
						this._paramCount = data.length;
						this._loader = data as TLoader;
				} else {
						this._loader = () => data;
						initialValue = data;
				}

				const modifiedMaper = this._mapper
						? ((d : [any, any]) => [
								this._mapper
										? this._mapper(d[0])
										: undefined,
								d[1]
						])
						: undefined
				this._defaultObservable = new AObservable([
						initialValue, initialValue
								? "idle"
								: "start"
				], modifiedMaper);
				this._observables = {};
		}

		getObs(...params : any[]) : AObservable | undefined {
				const self = this;
				if (params.length < 1) {
						return undefined;
				} else {
						const pars : any = params.slice(0, this._paramCount);
						let key : string = btoa(encodeURIComponent(pars));
						let ret : AObservable = this._observables[key];
						if (ret !== undefined) 
								return ret;
						else {
								const fullPars = allPossible(pars)


								fullPars.map(parCollection => {
										let key : string = btoa(encodeURIComponent(parCollection as any));
										let obs : AObservable = this._observables[key];
										if (!obs) {
												const modifiedMaper = self._mapper
														? ((d : [any, any]) => [
																self._mapper
																		? self._mapper(d[0])
																		: undefined,
																d[1]
														])
														: undefined
												self._observables[key] = new AObservable([
														undefined, "start"
												], modifiedMaper);
										}
								});
							

								return this._observables[key];
						}

				}
		}

		nextByParameter(value:any,...params:any[]):void{

		}
		map(mapper : TMapper) {

				return new AsService(this, mapper, this)
		}
		async load(...params : any[]) : Promise < any > {
				const ret = new Promise((resolve, reject) => {
						if (this._source !== undefined) {} else {
								const loadValue = this._loader(...params);
								const obs = this.getObs(...params);

								if (loadValue instanceof AObservable) {} else if (loadValue instanceof Promise) {
										if (obs) 
												obs.next([
														obs.getValue()[0],
														"loading"
												]);
										loadValue.then((data) => {

												let state = "idle";
												const promisRet = [data, state];

												if (obs) 
														obs.next(promisRet);
												this
														._defaultObservable
														.next(promisRet);
												resolve(promisRet);
												return promisRet;
										}).catch((e) => {
												if (obs) 
														obs.next([
																obs.getValue()[0],
																"error"
														]);
												
												this
														._defaultObservable
														.next([
																this
																		._defaultObservable
																		.getValue()[0],
																"error"
														]);
												reject(new Error(e));
										});
								} else {
										try {

												if (obs) 
														obs.next([loadValue, "idle"]);
												this
														._defaultObservable
														.next([loadValue, "idle"]);

												resolve(loadValue);
										} catch (e) {
												this
														._defaultObservable
														.next([
																this
																		._defaultObservable
																		.getValue()[0],
																"error"
														]);
												if (obs) 
														obs.next([
																obs.getValue()[0],
																"error"
														]);
												reject(new Error(e));
										}
								}
						}
				});
				return ret;
		}

		remove(...params : any[]) : void {
				if(params.length < 1) {
						return undefined;
				} else {
						const pars : any = params.slice(0, this._paramCount);
						let key : string = btoa(encodeURIComponent(pars));
						let ret : AObservable = this._observables[key];
						if (ret !== undefined) {
								delete this._observables[key];
						}
				}
		}
		subscribe(func : (d : any) => void, ...params : any[]) : ASubscriber | undefined {
				if(params.length < 1) {
						return this
								._defaultObservable
								.subscribe(func);
				} else {
						const obs = this.getObs(...params);
						if (obs) {
								return obs.subscribe(func);
						} else {
								return undefined;
						}
				}
		}
}
