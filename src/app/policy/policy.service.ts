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

  /**
   * @returns an Observable of the policies
   */
  private getPolicies(): Observable<Record<string, Record<string, Record<string, string>>>> {
    return this.policyControllerService.getPolicies().pipe(
      shareReplay(1) // cache, only need to fetch them once
    );
  }

  /**
   * @param entityType
   * @returns all polices for the entityType
   */
  private getPoliciesForType(entityType: string): Observable<Record<string, Record<string, string>>> {
    return this.getPolicies().pipe(
      map(policies => {
        return policies[entityType];
      })
    );
  }

  /**
   * 
   * evaluatePolicies("Todo", {title: 'my title'}) returns
   * {
   *   entity: {title: 'my title'},
   *   policyResults: {
   *     title: {
   *       EditableIf: false,
   *       VisibleIf: true
   *     }
   *   }
   * }
   * 
   * @param entityType 
   * @param entity$ 
   * @returns evaluated policies for the entity, and the entity itself
   */
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
