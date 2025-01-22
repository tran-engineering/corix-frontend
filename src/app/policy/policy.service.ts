import { Injectable } from '@angular/core';
import { eval as casbinEval, parse as casbinParse } from '@casbin/expression-eval';
import { combineLatest, map, Observable, shareReplay } from 'rxjs';
import { PolicyControllerService } from '../../gen/policy-api';

@Injectable({
  providedIn: 'root'
})
export class PolicyService {

  constructor(private policyControllerService: PolicyControllerService) {
  }

  private getPolicies(): Observable<Record<string, Record<string, Record<string, string>>>> {
    return this.policyControllerService.getPolicies().pipe(
      shareReplay(1)
    );
  }

  public getPolicy(entityType: string, policyType: string): Observable<Record<string, string>> {
    return this.getPolicies().pipe(
      map(policies => {
        console.log(policies);
        return policies[entityType][policyType];
      })
    );
  }

  public getPoliciesForType(entityType: string): Observable<Record<string, Record<string, string>>> {
    return this.getPolicies().pipe(
      map(policies => {
        return policies[entityType];
      })
    );
  }

  public evaluatePolicies<T extends object>(entityType: string, entity$: Observable<T>): Observable<{ entity: T, policyResults: Record<string, Record<string, boolean>> }> {
    return combineLatest([
      this.getPoliciesForType(entityType),
      entity$
    ]).pipe(
      map(([policiesByField, entity]) => {
        const results = Object.entries(policiesByField).map(([field, policies]) => {
          const policyResults = Object.fromEntries(Object.entries(policies).map(([policyName, expression]) => {
            const result = casbinEval(casbinParse(expression), entity);
            return [policyName, result];
          }));
          return [field, policyResults];
        });
        return {
          entity,
          policyResults: Object.fromEntries(results)
        };
      }),
    );
  }

}
