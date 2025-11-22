"""Forecasting Service for cash flow predictions using ML."""
from typing import List, Dict, Optional, Tuple
from uuid import UUID
from decimal import Decimal
from datetime import date, datetime, timedelta
import pandas as pd
import numpy as np

from sqlalchemy.orm import Session

from app.crud import bank_transaction as bt_crud
from app.crud import payment_schedule as ps_crud
from app.crud import cash_flow_forecast as forecast_crud
from app.models.treasury import CashFlowForecast


class ForecastingService:
    """Service for cash flow forecasting using ML models."""

    def __init__(self, db: Session):
        self.db = db

    def prepare_data_for_prophet(
        self,
        tenant_id: UUID,
        months_back: int = 12
    ) -> pd.DataFrame:
        """Prepare historical data in Prophet format (ds, y)."""
        end_date = date.today()
        start_date = end_date - timedelta(days=months_back * 30)

        # Get all transactions
        transactions = bt_crud.get_by_date_range(
            self.db,
            tenant_id=tenant_id,
            start_date=start_date,
            end_date=end_date
        )

        if not transactions:
            return pd.DataFrame(columns=['ds', 'y'])

        # Convert to DataFrame
        data = []
        for t in transactions:
            if t.balance_after is not None:
                data.append({
                    'ds': t.transaction_date,
                    'y': float(t.balance_after)
                })

        df = pd.DataFrame(data)
        
        if df.empty:
            return df

        # Group by date and take the last balance of each day
        df = df.groupby('ds').last().reset_index()
        df = df.sort_values('ds')

        return df

    def generate_forecast(
        self,
        tenant_id: UUID,
        horizon_days: int = 180,
        model_type: str = "auto"
    ) -> Dict:
        """Generate cash flow forecast."""
        # Prepare data
        df = self.prepare_data_for_prophet(tenant_id)

        if df.empty or len(df) < 30:
            # Not enough data, use simple linear projection
            return self._generate_simple_forecast(tenant_id, horizon_days)

        # Determine model type
        if model_type == "auto":
            if len(df) < 90:
                model_type = "linear"
            elif len(df) < 180:
                model_type = "prophet"
            else:
                model_type = "prophet"  # Could be LSTM with more data

        if model_type == "prophet":
            return self._generate_prophet_forecast(tenant_id, df, horizon_days)
        else:
            return self._generate_simple_forecast(tenant_id, horizon_days)

    def _generate_prophet_forecast(
        self,
        tenant_id: UUID,
        df: pd.DataFrame,
        horizon_days: int
    ) -> Dict:
        """Generate forecast using Prophet."""
        try:
            from prophet import Prophet

            # Train Prophet model
            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=False,
                daily_seasonality=False,
                interval_width=0.95
            )
            model.fit(df)

            # Generate future dates
            future = model.make_future_dataframe(periods=horizon_days)
            forecast = model.predict(future)

            # Extract forecasts (only future dates)
            today = date.today()
            future_forecast = forecast[forecast['ds'] > pd.Timestamp(today)]

            # Get payment schedules to integrate
            schedules = ps_crud.get_upcoming(self.db, tenant_id=tenant_id, days_ahead=horizon_days)

            # Generate scenarios
            scenarios = self._generate_scenarios(future_forecast, schedules)

            # Detect risks
            risks = self._detect_risks(scenarios['realistic'])

            return {
                "model_type": "prophet",
                "scenarios": scenarios,
                "risks": risks,
                "model_accuracy": None,  # Would need validation set
            }

        except ImportError:
            # Prophet not installed, fallback to simple forecast
            return self._generate_simple_forecast(tenant_id, horizon_days)
        except Exception as e:
            # Error in Prophet, fallback
            print(f"Prophet error: {e}")
            return self._generate_simple_forecast(tenant_id, horizon_days)

    def _generate_simple_forecast(
        self,
        tenant_id: UUID,
        horizon_days: int
    ) -> Dict:
        """Generate simple linear forecast."""
        from app.crud import bank_account as ba_crud

        # Get current balance
        current_balance = ba_crud.get_total_balance(self.db, tenant_id=tenant_id)

        # Calculate average daily change over last 30 days
        end_date = date.today()
        start_date = end_date - timedelta(days=30)

        transactions = bt_crud.get_by_date_range(
            self.db,
            tenant_id=tenant_id,
            start_date=start_date,
            end_date=end_date
        )

        if transactions:
            total_change = sum(t.amount for t in transactions if t.status == "cleared")
            avg_daily_change = total_change / 30
        else:
            avg_daily_change = Decimal("0")

        # Get payment schedules
        schedules = ps_crud.get_upcoming(self.db, tenant_id=tenant_id, days_ahead=horizon_days)

        # Generate forecast
        forecasts = []
        current_date = date.today()
        balance = current_balance

        for i in range(horizon_days):
            current_date += timedelta(days=1)
            
            # Add daily trend
            balance += avg_daily_change

            # Add scheduled payments for this date
            for schedule in schedules:
                if schedule.due_date == current_date:
                    if schedule.is_income:
                        balance += schedule.remaining_amount * Decimal("0.9")  # 90% probability
                    else:
                        balance -= schedule.remaining_amount

            forecasts.append({
                "forecast_date": current_date,
                "predicted_balance": balance,
                "predicted_income": avg_daily_change if avg_daily_change > 0 else Decimal("0"),
                "predicted_expenses": abs(avg_daily_change) if avg_daily_change < 0 else Decimal("0"),
                "confidence_lower": balance * Decimal("0.9"),
                "confidence_upper": balance * Decimal("1.1"),
                "scenario": "realistic",
                "model_type": "linear",
            })

        # Generate scenarios
        scenarios = {
            "realistic": forecasts,
            "optimistic": self._adjust_scenario(forecasts, 1.1),
            "pessimistic": self._adjust_scenario(forecasts, 0.9),
        }

        # Detect risks
        risks = self._detect_risks(forecasts)

        return {
            "model_type": "linear",
            "scenarios": scenarios,
            "risks": risks,
            "model_accuracy": None,
        }

    def _generate_scenarios(
        self,
        prophet_forecast: pd.DataFrame,
        schedules: List
    ) -> Dict[str, List[Dict]]:
        """Generate optimistic, realistic, and pessimistic scenarios."""
        scenarios = {}

        for scenario_name, multiplier in [("realistic", 1.0), ("optimistic", 1.1), ("pessimistic", 0.9)]:
            forecasts = []
            
            for _, row in prophet_forecast.iterrows():
                forecast_date = row['ds'].date()
                predicted_balance = Decimal(str(row['yhat'])) * Decimal(str(multiplier))
                
                # Add scheduled payments
                for schedule in schedules:
                    if schedule.due_date == forecast_date:
                        if schedule.is_income:
                            predicted_balance += schedule.remaining_amount * Decimal("0.9")
                        else:
                            predicted_balance -= schedule.remaining_amount

                forecasts.append({
                    "forecast_date": forecast_date,
                    "predicted_balance": predicted_balance,
                    "predicted_income": Decimal("0"),  # Simplified
                    "predicted_expenses": Decimal("0"),  # Simplified
                    "confidence_lower": Decimal(str(row['yhat_lower'])),
                    "confidence_upper": Decimal(str(row['yhat_upper'])),
                    "scenario": scenario_name,
                    "model_type": "prophet",
                })

            scenarios[scenario_name] = forecasts

        return scenarios

    def _adjust_scenario(self, base_forecasts: List[Dict], multiplier: float) -> List[Dict]:
        """Adjust forecast for different scenarios."""
        adjusted = []
        for f in base_forecasts:
            adjusted.append({
                **f,
                "predicted_balance": f["predicted_balance"] * Decimal(str(multiplier)),
                "confidence_lower": f["confidence_lower"] * Decimal(str(multiplier)),
                "confidence_upper": f["confidence_upper"] * Decimal(str(multiplier)),
                "scenario": "optimistic" if multiplier > 1 else "pessimistic",
            })
        return adjusted

    def _detect_risks(self, forecasts: List[Dict]) -> List[str]:
        """Detect cash flow risks from forecasts."""
        risks = []

        # Check for negative balance
        negative_dates = [
            f for f in forecasts
            if f["predicted_balance"] < 0
        ]

        if negative_dates:
            first_negative = negative_dates[0]
            days_until = (first_negative["forecast_date"] - date.today()).days
            risks.append(
                f"Risque de trésorerie négative dans {days_until} jours "
                f"(le {first_negative['forecast_date'].strftime('%d/%m/%Y')})"
            )

        # Check for low balance (< 100k)
        low_balance_dates = [
            f for f in forecasts
            if 0 < f["predicted_balance"] < 100000
        ]

        if low_balance_dates:
            first_low = low_balance_dates[0]
            days_until = (first_low["forecast_date"] - date.today()).days
            if days_until < 30:
                risks.append(
                    f"Solde faible prévu dans {days_until} jours "
                    f"({first_low['predicted_balance']:.2f} XOF)"
                )

        return risks

    def save_forecasts(
        self,
        tenant_id: UUID,
        forecast_data: Dict
    ) -> List[CashFlowForecast]:
        """Save forecast results to database."""
        saved_forecasts = []

        for scenario_name, forecasts in forecast_data["scenarios"].items():
            forecast_dicts = [
                {
                    "forecast_date": f["forecast_date"],
                    "predicted_balance": f["predicted_balance"],
                    "predicted_income": f["predicted_income"],
                    "predicted_expenses": f["predicted_expenses"],
                    "confidence_lower": f["confidence_lower"],
                    "confidence_upper": f["confidence_upper"],
                    "scenario": scenario_name,
                    "model_type": forecast_data["model_type"],
                    "model_accuracy": forecast_data.get("model_accuracy"),
                }
                for f in forecasts
            ]

            saved = forecast_crud.save_forecast(
                self.db,
                tenant_id=tenant_id,
                forecasts=forecast_dicts
            )
            saved_forecasts.extend(saved)

        return saved_forecasts


forecasting_service = ForecastingService
